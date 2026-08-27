"""
Analytics API Server
Exposes pipeline analytics data as REST endpoints consumed by the Next.js frontend.

Start with:
  source .venv/bin/activate
  uvicorn api.server:app --reload --port 8000
"""

import json
import os
import sys
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from pipeline.processor import process, CONTENT_TYPE_LABELS, PLATFORM_LABELS
from pipeline.retriever import fetch_graph_context
from pipeline.llm_analyst import generate_recommendations
from pipeline.admin_stats import build_admin_stats
from pipeline.admin_users import (
    get_admin_user,
    list_admin_users,
    set_admin_user_account_status,
)
from pipeline.admin_user_analytics import get_admin_user_analytics
from pipeline.admin_organizations import get_admin_organization, list_admin_organizations
from pipeline.admin_recent_activity import list_admin_recent_activity
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

cors_origins = [
    origin.strip()
    for origin in os.getenv("GRAPH_API_CORS_ORIGINS", "").split(",")
    if origin.strip()
] or DEFAULT_CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    allow_credentials=True,
)


class LoginPayload(BaseModel):
    email: str
    password: str


class AccountStatusPayload(BaseModel):
    active: bool


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


@app.post("/api/admin/users/{user_id}/account-status")
def admin_user_account_status(
    request: Request,
    user_id: str,
    payload: AccountStatusPayload,
):
    _require_admin_session(request)
    try:
        user = set_admin_user_account_status(user_id, active=payload.active)
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
