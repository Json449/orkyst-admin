"""
Analytics API Server
Exposes pipeline analytics data as REST endpoints consumed by the Next.js frontend.

Start with:
  source .venv/bin/activate
  uvicorn api.server:app --reload --port 8000
"""

import json
import logging
import os
import sys
import threading
from collections import defaultdict
from pathlib import Path

from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
environment = os.getenv("GRAPH_API_ENVIRONMENT", "development").strip().lower()
environment_file = ROOT / f".env.{environment}"
if environment in {"staging", "production"} and environment_file.exists():
    load_dotenv(environment_file, override=False)
load_dotenv(ROOT / ".env", override=False)
if environment not in {"production", "staging"}:
    backend_env = ROOT.parent / "backend" / ".env"
    if backend_env.exists():
        legacy_template_mongo_uri = os.getenv("MONGODB_CONNECTION_URL", "").strip()
        load_dotenv(backend_env, override=False)
        # Templates are consumed by the main Orkyst API, so local Admin uploads
        # must use that same Mongo database even if this analytics app has its
        # own Mongo connection for dashboard data.
        backend_mongo_uri = dotenv_values(backend_env).get("MONGODB_CONNECTION_URL", "")
        if backend_mongo_uri:
            os.environ.setdefault("ORKYST_TEMPLATE_MONGO_URI", backend_mongo_uri)
        if legacy_template_mongo_uri:
            os.environ.setdefault("ORKYST_TEMPLATE_LEGACY_MONGO_URI", legacy_template_mongo_uri)

from pipeline.processor import process, CONTENT_TYPE_LABELS, PLATFORM_LABELS
from pipeline.retriever import fetch_graph_context
from pipeline.llm_analyst import generate_recommendations
from pipeline.admin_stats import build_admin_stats
from pipeline.admin_users import (
    _admin_account_status_code,
    get_admin_user,
    list_admin_users,
    reset_admin_user_package_usage,
    set_admin_user_account_status,
)
from pipeline.admin_notifications import send_account_status_email, send_onboarding_email
from pipeline.admin_user_analytics import get_admin_user_analytics
from pipeline.admin_user_activity_detail import get_admin_user_activity_detail
from pipeline.admin_organizations import get_admin_organization, list_admin_organizations
from pipeline.admin_recent_activity import list_admin_recent_activity
from pipeline.admin_templates import (
    create_admin_template,
    create_admin_templates,
    create_template_category,
    create_template_subcategory,
    delete_admin_template,
    delete_template_category,
    delete_template_subcategory,
    list_admin_templates,
    list_template_categories,
    update_admin_template,
    update_template_category,
    update_template_subcategory,
)
from api.admin_auth import (
    SESSION_MAX_AGE_SECONDS,
    authenticate_admin,
    create_session,
    ensure_admin_db,
    verify_session,
)

INPUT_DATA = ROOT / "dummy_input_data.json"
AUTH_COOKIE_NAME = "graph_admin_session"
DEFAULT_CORS_ORIGINS = [
    "https://admin-app.orkyst.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003",
]

PLATFORM_COLORS = {
    "linkedin": "#0A66C2",
    "instagram": "#E4405F",
    "twitter": "#1DA1F2",
    "facebook": "#1877F2",
}

app = FastAPI(title="Orkyst Analytics API")
ensure_admin_db()
logger = logging.getLogger(__name__)
# Backward compatibility only: previously uploaded local templates remain
# readable at their existing URLs. New template uploads never write here.
legacy_template_uploads = ROOT / "data" / "template-uploads"
if legacy_template_uploads.is_dir():
    app.mount(
        "/uploads/templates",
        StaticFiles(directory=str(legacy_template_uploads)),
        name="legacy-template-uploads",
    )


@app.on_event("startup")
def sync_legacy_admin_templates_on_startup():
    def run_template_migration_check() -> None:
        try:
            list_admin_templates()
        except Exception as exc:
            logger.warning("Template migration check skipped: %s", exc)

    # Atlas can occasionally take several seconds to select a primary. This
    # migration is maintenance work, so it must not delay API readiness and
    # make every admin route appear offline while MongoDB reconnects.
    threading.Thread(
        target=run_template_migration_check,
        name="admin-template-migration",
        daemon=True,
    ).start()

cors_origins = [
    origin.strip()
    for origin in os.getenv("GRAPH_API_CORS_ORIGINS", "").split(",")
    if origin.strip()
] or DEFAULT_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    allow_credentials=True,
)


class LoginPayload(BaseModel):
    email: str
    password: str


class AccountStatusPayload(BaseModel):
    active: bool
    code: str


class PackageUsageResetPayload(BaseModel):
    code: str

class OnboardingEmailPayload(BaseModel):
    email: str
    temporary_password: str
    login_url: str
    team_name: str = "Sukli"
    code: str


class TemplateAssignmentPayload(BaseModel):
    categoryId: str
    subcategoryIds: list[str] = Field(default_factory=list)


class TemplateUploadPayload(BaseModel):
    name: str = ""
    description: str = ""
    category: str = ""
    assignments: list[TemplateAssignmentPayload] = Field(default_factory=list)
    imageData: str
    code: str


class TemplateBatchItemPayload(BaseModel):
    name: str = ""
    description: str = ""
    imageData: str


class TemplateBatchUploadPayload(BaseModel):
    category: str = ""
    assignments: list[TemplateAssignmentPayload] = Field(default_factory=list)
    items: list[TemplateBatchItemPayload]
    code: str


class TemplateUpdatePayload(BaseModel):
    name: str = ""
    description: str = ""
    category: str = ""
    assignments: list[TemplateAssignmentPayload] = Field(default_factory=list)
    imageData: str | None = None
    code: str


class TemplateDeletePayload(BaseModel):
    code: str


class TemplateCategoryPayload(BaseModel):
    name: str
    code: str


class TemplateSubcategoryPayload(BaseModel):
    name: str
    imageData: str | None = None
    code: str


def _fmt_number(n: int | float) -> str:
    if isinstance(n, float):
        return f"{n:.1f}%"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


def _delta_str(pct: float) -> str:
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct:.1f}%"


def _auth_bypass_enabled() -> bool:
    """
    Dev-only escape hatch for designing screens without a live admin session.

    Enabled only when ADMIN_AUTH_DISABLED is truthy AND we are not in production.
    Defaults to off, so normal runs keep requiring a real session.
    """
    if os.getenv("ENVIRONMENT") == "production":
        return False
    return os.getenv("ADMIN_AUTH_DISABLED", "").strip().lower() in {"1", "true", "yes", "on"}


DESIGN_MODE_SESSION = {"sub": "0", "email": "design@local", "role": "admin"}


def _require_admin_session(request: Request) -> dict:
    session = verify_session(request.cookies.get(AUTH_COOKIE_NAME))
    if not session:
        if _auth_bypass_enabled():
            return dict(DESIGN_MODE_SESSION)
        raise HTTPException(status_code=401, detail="Please sign in to view this dashboard")
    return session


@app.post("/api/auth/login")
def login(payload: LoginPayload, response: Response):
    admin = authenticate_admin(payload.email, payload.password)
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=create_session(admin),
        httponly=True,
        secure=os.getenv("ENVIRONMENT") == "production",
        samesite="lax",
        max_age=SESSION_MAX_AGE_SECONDS,
        path="/",
    )
    return {
        "status": 200,
        "result": {
            "email": admin["email"],
            "role": admin["role"],
        },
    }


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie(AUTH_COOKIE_NAME, path="/")
    return {"status": 200}


@app.get("/api/auth/me")
def auth_me(request: Request):
    session = verify_session(request.cookies.get(AUTH_COOKIE_NAME))
    return {
        "authenticated": bool(session),
        "email": session.get("email") if session else None,
        "role": session.get("role") if session else None,
    }


@app.get("/api/analytics/cta")
def cta_analytics(request: Request, user_id: str = Query(default="local_test")):
    _require_admin_session(request)
    data = process(INPUT_DATA)
    raw = json.loads(INPUT_DATA.read_text())
    ov = data["overview"]
    cta = ov["ctaPerformance"]

    # CTR per content type (clicks / impressions for that type)
    ct_impressions: dict[str, int] = defaultdict(int)
    for p in raw["posts"]:
        ct_impressions[p["contentType"]] += p["metrics"]["impressions"]

    cta_breakdown = [
        {
            "name": item["label"],
            "clicks": item["clicks"],
            "ctr": round(
                item["clicks"] / ct_impressions[item["type"]] * 100, 1
            ) if ct_impressions.get(item["type"]) else 0,
        }
        for item in ov["clicksByContentType"]
    ]

    return {
        "metrics": {
            "totalLinkClicks": {
                "value": _fmt_number(cta["totalLinkClicks"]["value"]),
                "change": _delta_str(cta["totalLinkClicks"]["deltaPct"]),
            },
            "siteVisits": {
                "value": _fmt_number(cta["siteVisits"]["value"]),
                "change": _delta_str(cta["siteVisits"]["deltaPct"]),
            },
            "newAudience": {
                "value": _fmt_number(cta["newAudience"]["value"]),
                "change": _delta_str(cta["newAudience"]["deltaPct"]),
            },
            "avgCtr": {
                "value": f"{cta['avgCtr']['value'] * 100:.1f}%",
                "change": _delta_str(cta["avgCtr"]["deltaPct"]),
            },
        },
        "clicksByContentType": cta_breakdown,
    }


@app.get("/api/analytics/posts")
def posts_analytics(request: Request, user_id: str = Query(default="local_test")):
    _require_admin_session(request)
    data = process(INPUT_DATA)
    ov = data["overview"]
    account = data["account"]
    top = data["posts"]

    platform_dist = [
        {
            "name": PLATFORM_LABELS.get(item["platform"], item["platform"]),
            "value": item["sharePct"],
            "color": PLATFORM_COLORS.get(item["platform"], "#888888"),
        }
        for item in ov["platformDistribution"]
    ]

    # Downsample trend to ~7 representative points for a cleaner chart
    trend_points = account["engagementTrend"]
    step = max(1, len(trend_points) // 7)
    sampled = trend_points[::step][:7]
    # Format dates as "Jan 1" style
    import datetime
    def _short_date(iso: str) -> str:
        try:
            d = datetime.date.fromisoformat(iso)
            return d.strftime("%b %-d")
        except Exception:
            return iso

    engagement_trend = [
        {"date": _short_date(pt["date"]), "impressions": pt["impressions"], "engagements": pt["engagements"]}
        for pt in sampled
    ]

    top_posts = [
        {
            "title": p["title"],
            "platform": p["platform"],
            "type": p["contentTypeLabel"],
            "impressions": p["impressionsLabel"],
            "engagements": p["engagementsLabel"],
            "engagementRate": p["engagementRateLabel"],
        }
        for p in top["posts"][:3]
    ]

    return {
        "engagementTrend": engagement_trend,
        "platformDistribution": platform_dist,
        "topPosts": top_posts,
    }


@app.get("/api/analytics/sentiment")
def sentiment_analytics(request: Request, user_id: str = Query(default="local_test")):
    _require_admin_session(request)
    data = process(INPUT_DATA)
    s = data["sentiment"]

    overall = s["overall"]
    sentiment_data = [
        {"name": "Positive", "value": overall["positivePct"], "color": "#22C55E"},
        {"name": "Neutral",  "value": overall["neutralPct"],  "color": "#6B7280"},
        {"name": "Negative", "value": overall["negativePct"], "color": "#EF4444"},
    ]

    by_platform = [
        {
            "platform": PLATFORM_LABELS.get(item["platform"], item["platform"]),
            "positive": item["positivePct"],
            "neutral":  item["neutralPct"],
            "negative": item["negativePct"],
        }
        for item in s["byPlatform"]
    ]

    return {
        "sentimentData": sentiment_data,
        "byPlatform": by_platform,
        "keywords": s["trendingKeywords"],
        "totalAnalyzed": s["totalAnalyzed"],
        "trendDeltaPct": s["trendDeltaPct"],
        "trendLabel": s["trendLabel"],
        "positivePct": overall["positivePct"],
    }


@app.get("/api/analytics/recommendations")
def recommendations_analytics(request: Request, user_id: str = Query(default="local_test")):
    _require_admin_session(request)
    graph = fetch_graph_context(user_id=user_id)
    if not graph["chunk_texts"]:
        return {
            "bestDay": "—",
            "bestTime": "—",
            "topPlatform": "—",
            "projectedUpliftPct": 0,
            "insight": "No data found. Run the pipeline first.",
            "recommendations": [],
        }
    return generate_recommendations(graph)


@app.get("/api/admin/user-stats")
def admin_user_stats(request: Request):
    _require_admin_session(request)
    return build_admin_stats()


@app.get("/api/admin/templates")
def admin_templates(request: Request):
    _require_admin_session(request)
    try:
        return list_admin_templates()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.get("/api/admin/template-categories")
def admin_template_categories(request: Request):
    _require_admin_session(request)
    try:
        return list_template_categories()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/api/admin/template-categories")
def admin_create_template_category(request: Request, payload: TemplateCategoryPayload):
    admin = _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        return create_template_category(
            name=payload.name,
            created_by=admin.get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.put("/api/admin/template-categories/{category_id}")
def admin_update_template_category(
    request: Request, category_id: str, payload: TemplateCategoryPayload
):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        category = update_template_category(category_id=category_id, name=payload.name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not category:
        raise HTTPException(status_code=404, detail="Template category not found")
    return category


@app.delete("/api/admin/template-categories/{category_id}")
def admin_delete_template_category(
    request: Request, category_id: str, payload: TemplateDeletePayload
):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        deleted = delete_template_category(category_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Template category not found")
    return {"status": 200}


@app.post("/api/admin/template-categories/{category_id}/subcategories")
def admin_create_template_subcategory(
    request: Request, category_id: str, payload: TemplateSubcategoryPayload
):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        subcategory = create_template_subcategory(
            category_id=category_id, name=payload.name, image_data=payload.imageData
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not subcategory:
        raise HTTPException(status_code=404, detail="Template category not found")
    return subcategory


@app.put("/api/admin/template-categories/{category_id}/subcategories/{subcategory_id}")
def admin_update_template_subcategory(
    request: Request,
    category_id: str,
    subcategory_id: str,
    payload: TemplateSubcategoryPayload,
):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        subcategory = update_template_subcategory(
            category_id=category_id,
            subcategory_id=subcategory_id,
            name=payload.name,
            image_data=payload.imageData,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not subcategory:
        raise HTTPException(status_code=404, detail="Template subcategory not found")
    return subcategory


@app.delete("/api/admin/template-categories/{category_id}/subcategories/{subcategory_id}")
def admin_delete_template_subcategory(
    request: Request,
    category_id: str,
    subcategory_id: str,
    payload: TemplateDeletePayload,
):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        deleted = delete_template_subcategory(
            category_id=category_id, subcategory_id=subcategory_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Template subcategory not found")
    return {"status": 200}


@app.post("/api/admin/templates")
def admin_create_template(request: Request, payload: TemplateUploadPayload):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        return create_admin_template(
            name=payload.name,
            category=payload.category,
            description=payload.description,
            taxonomy_assignments=[
                {"categoryId": item.categoryId, "subcategoryIds": item.subcategoryIds}
                for item in payload.assignments
            ],
            image_data=payload.imageData,
            uploaded_by=_require_admin_session(request).get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/api/admin/templates/batch")
def admin_create_templates_batch(
    request: Request, payload: TemplateBatchUploadPayload
):
    admin = _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        return create_admin_templates(
            items=[
                {"name": item.name, "description": item.description, "imageData": item.imageData}
                for item in payload.items
            ],
            category=payload.category,
            taxonomy_assignments=[
                {"categoryId": item.categoryId, "subcategoryIds": item.subcategoryIds}
                for item in payload.assignments
            ],
            uploaded_by=admin.get("email"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.put("/api/admin/templates/{template_id}")
def admin_update_template(request: Request, template_id: str, payload: TemplateUpdatePayload):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        template = update_admin_template(
            template_id=template_id,
            name=payload.name,
            category=payload.category,
            description=payload.description,
            taxonomy_assignments=[
                {"categoryId": item.categoryId, "subcategoryIds": item.subcategoryIds}
                for item in payload.assignments
            ],
            image_data=payload.imageData,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@app.delete("/api/admin/templates/{template_id}")
def admin_delete_template(request: Request, template_id: str, payload: TemplateDeletePayload):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    try:
        deleted = delete_admin_template(template_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": 200}


@app.get("/api/admin/recent-activity")
def admin_recent_activity(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
):
    _require_admin_session(request)
    return list_admin_recent_activity(limit=limit)


@app.get("/api/admin/users")
def admin_users(
    request: Request,
    query: str = Query(default=""),
    status: str = Query(default="all"),
    plan: str = Query(default="all"),
    provider: str = Query(default="all"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    _require_admin_session(request)
    return list_admin_users(
        query=query,
        status=status,
        plan=plan,
        provider=provider,
        page=page,
        page_size=page_size,
    )


@app.get("/api/admin/users/{user_id}")
def admin_user_detail(request: Request, user_id: str):
    _require_admin_session(request)
    user = get_admin_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/api/admin/onboarding/send-email")
def admin_send_onboarding_email(request: Request, payload: OnboardingEmailPayload):
    _require_admin_session(request)
    if payload.code.strip() != _admin_account_status_code():
        raise HTTPException(status_code=403, detail="Invalid admin security code")
    if not payload.temporary_password.strip():
        raise HTTPException(status_code=400, detail="Temporary password is required")
    try:
        sent = send_onboarding_email(recipient=str(payload.email), temporary_password=payload.temporary_password, login_url=payload.login_url, team_name=payload.team_name.strip() or "Sukli")
    except Exception as exc:
        logger.exception("Unable to send onboarding email")
        raise HTTPException(status_code=502, detail="Unable to send onboarding email") from exc
    if not sent:
        raise HTTPException(status_code=503, detail="SMTP is not configured")
    return {"status": 200, "message": "Onboarding email sent"}


@app.post("/api/admin/users/{user_id}/account-status")
def admin_user_account_status(
    request: Request,
    user_id: str,
    payload: AccountStatusPayload,
):
    session = _require_admin_session(request)
    try:
        user = set_admin_user_account_status(user_id, active=payload.active, code=payload.code)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    try:
        send_account_status_email(
            user,
            active=payload.active,
            sender_email=session.get("email"),
        )
    except Exception:
        logger.exception("Unable to send account status email for user %s", user_id)
    return user


@app.post("/api/admin/users/{user_id}/reset-package-usage")
def admin_user_package_usage_reset(
    request: Request,
    user_id: str,
    payload: PackageUsageResetPayload,
):
    _require_admin_session(request)
    try:
        user = reset_admin_user_package_usage(user_id, code=payload.code)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.get("/api/admin/users/{user_id}/analytics")
def admin_user_analytics(
    request: Request,
    user_id: str,
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    content_type: str = Query(default="all"),
    activity_type: str = Query(default="all"),
    platform: str = Query(default="all"),
    campaign_id: str = Query(default="all"),
    gallery_page: int = Query(default=1, ge=1),
    gallery_page_size: int = Query(default=12, ge=1, le=100),
    activity_page: int = Query(default=1, ge=1),
    activity_page_size: int = Query(default=20, ge=1, le=100),
):
    _require_admin_session(request)
    analytics = get_admin_user_analytics(
        user_id,
        date_from=date_from,
        date_to=date_to,
        content_type=content_type,
        activity_type=activity_type,
        platform=platform,
        campaign_id=campaign_id,
        gallery_page=gallery_page,
        gallery_page_size=gallery_page_size,
        activity_page=activity_page,
        activity_page_size=activity_page_size,
    )
    if not analytics:
        raise HTTPException(status_code=404, detail="User not found")
    return analytics


@app.get("/api/admin/users/{user_id}/activity/{activity_id}")
def admin_user_activity_detail(request: Request, user_id: str, activity_id: str):
    _require_admin_session(request)
    try:
        detail = get_admin_user_activity_detail(user_id, activity_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if not detail:
        raise HTTPException(status_code=404, detail="Activity not found")
    return detail


@app.get("/api/admin/organizations")
def admin_organizations(
    request: Request,
    query: str = Query(default=""),
    status: str = Query(default="all"),
    plan: str = Query(default="all"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    _require_admin_session(request)
    return list_admin_organizations(
        query=query,
        status=status,
        plan=plan,
        page=page,
        page_size=page_size,
    )


@app.get("/api/admin/organizations/{slug}")
def admin_organization_detail(request: Request, slug: str):
    _require_admin_session(request)
    organization = get_admin_organization(slug)
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization


@app.get("/health")
def health():
    return {"status": "ok"}
