from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from dotenv import dotenv_values


ROOT = Path(__file__).parent.parent
DEFAULT_ADMIN_DATA = ROOT / "admin_sample_data.json"
LOOKBACK_DAYS = 30
PLATFORMS = ("facebook", "instagram", "twitter", "linkedin")


def load_admin_source(
    json_path: str | Path = DEFAULT_ADMIN_DATA,
    auth_token: str | None = None,
) -> dict[str, Any]:
    """Load live admin data when configured, otherwise use local sample data."""
    mongo_uri = _orkyst_mongo_uri()
    if mongo_uri:
        return _load_from_mongo(mongo_uri)

    live_url = os.getenv("ORKYST_ADMIN_STATS_URL")
    if live_url:
        try:
            return _load_from_url(live_url, auth_token=auth_token)
        except URLError as exc:
            raise RuntimeError(f"Failed to load ORKYST_ADMIN_STATS_URL: {exc}") from exc

    path = Path(json_path)
    return json.loads(path.read_text())


def build_admin_stats(
    source: dict[str, Any] | None = None,
    auth_token: str | None = None,
) -> dict[str, Any]:
    source = source or load_admin_source(auth_token=auth_token)
    if "result" in source and isinstance(source["result"], dict):
        source = source["result"]
    if "totals" in source and "recentUsers" in source:
        return _with_admin_defaults(source)

    source_label = source.get("source") or ("live" if os.getenv("ORKYST_ADMIN_STATS_URL") else "sample")
    users = source.get("users", [])
    calendars = source.get("calendars", [])
    events = source.get("events", [])
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=LOOKBACK_DAYS)

    total_users = len(users)
    verified_users = sum(1 for user in users if user.get("isVerified"))
    onboarded_users = sum(1 for user in users if user.get("isOnboardingCompleted"))
    active_users = sum(
        1
        for user in users
        if _parse_date(user.get("lastLoginAt"))
        and _parse_date(user.get("lastLoginAt")) >= since
    )

    recent_users = sorted(
        users,
        key=lambda user: _parse_date(user.get("createdAt")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:12]

    activity_totals = _activity_totals(users)
    event_stats = _event_stats(events)

    return {
        "generatedAt": now.isoformat(),
        "source": source_label,
        "lookbackDays": LOOKBACK_DAYS,
        "totals": {
            "totalUsers": total_users,
            "verifiedUsers": verified_users,
            "onboardedUsers": onboarded_users,
            "notOnboardedUsers": total_users - onboarded_users,
            "activeUsers30d": active_users,
            "verificationRatePct": _percent(verified_users, total_users),
            "onboardingRatePct": _percent(onboarded_users, total_users),
            "activeRate30dPct": _percent(active_users, total_users),
        },
        "signupTrend": _daily_counts(users, "createdAt", since),
        "onboardingTrend": _daily_counts(users, "onboardingCompletedAt", since),
        "providerBreakdown": _field_counts(users, "provider", "local"),
        "planBreakdown": _field_counts(users, "plan", "basic"),
        "subscriptionBreakdown": _field_counts(users, "subscriptionStatus", "none"),
        "eventStatusBreakdown": _field_counts(events, "postingStatus", "draft"),
        "contentTypeBreakdown": _field_counts(events, "type", "social"),
        "socialConnections": [
            {
                "platform": platform,
                "count": sum(
                    1
                    for user in users
                    if platform in _connected_platforms(user)
                ),
            }
            for platform in PLATFORMS
        ],
        "activityTotals": activity_totals,
        "eventStats": event_stats,
        "recentActivity": _recent_activity(users, calendars, events),
        "recentUsers": [
            {
                "id": str(user.get("id") or user.get("_id") or ""),
                "email": user.get("email", ""),
                "fullname": user.get("fullname") or user.get("name") or "",
                "provider": user.get("provider", "local"),
                "plan": user.get("plan", "basic"),
                "billingProvider": user.get("billingProvider", "orkyst"),
                "subscriptionStatus": user.get("subscriptionStatus", "none"),
                "isVerified": bool(user.get("isVerified")),
                "isOnboardingCompleted": bool(user.get("isOnboardingCompleted")),
                "createdAt": user.get("createdAt"),
                "onboardingCompletedAt": user.get("onboardingCompletedAt"),
                "lastLoginAt": user.get("lastLoginAt"),
                "connectedPlatforms": _connected_platforms(user),
                "activityCounts": _normalize_activity(user.get("activityCounts", {})),
            }
            for user in recent_users
        ],
    }


def _load_from_url(url: str, auth_token: str | None = None) -> dict[str, Any]:
    headers = {"Accept": "application/json"}
    token = auth_token or os.getenv("ORKYST_ADMIN_API_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = Request(url, headers=headers)
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def _load_from_mongo(uri: str) -> dict[str, Any]:
    try:
        from pymongo import MongoClient
    except ImportError as exc:
        raise RuntimeError("pymongo is required for ORKYST_MONGO_URI live stats") from exc

    client = MongoClient(uri, serverSelectionTimeoutMS=20_000)
    db_name = os.getenv("ORKYST_MONGO_DB", "test")
    db = client[db_name]
    users = list(db["users"].find())
    calendars = list(db["calendars"].find())
    events = list(db["events"].find())
    return {
        "users": [_serialize_mongo_user(user) for user in users],
        "calendars": [_serialize_mongo_doc(calendar) for calendar in calendars],
        "events": [_serialize_mongo_doc(event) for event in events],
        "source": "live",
    }


def _orkyst_mongo_uri() -> str | None:
    configured = os.getenv("ORKYST_MONGO_URI") or os.getenv("MONGODB_CONNECTION_URL")
    if configured:
        return configured

    orkyst_env = ROOT.parent / "orkyst" / "backend" / ".env"
    if not orkyst_env.exists():
        return None

    values = dotenv_values(orkyst_env)
    return values.get("MONGODB_CONNECTION_URL")


def _serialize_mongo_user(user: dict[str, Any]) -> dict[str, Any]:
    serialized = _serialize_mongo_doc(user)
    serialized["activityCounts"] = {
        "calendars": int(serialized.get("calendarsGeneratedThisMonth", 0) or 0),
        "posts": int(serialized.get("socialPostsGeneratedThisMonth", 0) or 0),
        "images": int(serialized.get("imagesGeneratedThisMonth", 0) or 0),
        "reels": int(serialized.get("reelUsageThisMonth", 0) or 0),
    }
    return serialized


def _serialize_mongo_doc(doc: dict[str, Any]) -> dict[str, Any]:
    serialized = dict(doc)
    serialized["id"] = str(serialized.pop("_id", ""))
    for key, value in list(serialized.items()):
        if isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif hasattr(value, "__str__") and value.__class__.__name__ == "ObjectId":
            serialized[key] = str(value)
        elif isinstance(value, list):
            serialized[key] = [
                str(item) if hasattr(item, "__str__") and item.__class__.__name__ == "ObjectId" else item
                for item in value
            ]
    return serialized


def _parse_date(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        if value.tzinfo and value.utcoffset() is not None:
            return value.astimezone(timezone.utc)
        return value.replace(tzinfo=timezone.utc)
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        if parsed.tzinfo and parsed.utcoffset() is not None:
            return parsed.astimezone(timezone.utc)
        return parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _daily_counts(users: list[dict[str, Any]], field: str, since: datetime) -> list[dict[str, Any]]:
    counts: dict[str, int] = defaultdict(int)
    for user in users:
        date = _parse_date(user.get(field))
        if date and date >= since:
            counts[date.date().isoformat()] += 1
    return [{"date": date, "count": counts[date]} for date in sorted(counts)]


def _field_counts(users: list[dict[str, Any]], field: str, fallback: str) -> list[dict[str, Any]]:
    counts = Counter(str(user.get(field) or fallback) for user in users)
    return [
        {"name": name, "count": count}
        for name, count in sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    ]


def _connected_platforms(user: dict[str, Any]) -> list[str]:
    explicit = user.get("connectedPlatforms")
    if isinstance(explicit, list):
        return [str(platform) for platform in explicit]

    platforms = []
    for platform in PLATFORMS:
        if user.get(f"{platform}ConnectionStatus") == "connected":
            platforms.append(platform)
    return platforms


def _normalize_activity(activity: dict[str, Any]) -> dict[str, int]:
    return {
        "calendars": int(activity.get("calendars", 0) or 0),
        "posts": int(activity.get("posts", 0) or 0),
        "images": int(activity.get("images", 0) or 0),
        "reels": int(activity.get("reels", 0) or 0),
    }


def _activity_totals(users: list[dict[str, Any]]) -> dict[str, int]:
    totals = {"calendars": 0, "posts": 0, "images": 0, "reels": 0}
    for user in users:
        activity = _normalize_activity(user.get("activityCounts", {}))
        for key in totals:
            totals[key] += activity[key]
    return totals


def _event_stats(events: list[dict[str, Any]]) -> dict[str, int]:
    return {
        "totalEvents": len(events),
        "approvedEvents": sum(1 for event in events if event.get("isApproved")),
        "postedEvents": sum(1 for event in events if event.get("postingStatus") == "posted"),
        "scheduledEvents": sum(1 for event in events if event.get("postingStatus") == "scheduled"),
        "failedEvents": sum(1 for event in events if event.get("postingStatus") == "failed"),
    }


def _with_admin_defaults(source: dict[str, Any]) -> dict[str, Any]:
    activity_totals = source.get("activityTotals") or {}
    return {
        **source,
        "eventStatusBreakdown": source.get("eventStatusBreakdown", []),
        "contentTypeBreakdown": source.get("contentTypeBreakdown", []),
        "activityTotals": {
            "calendars": int(activity_totals.get("calendars", 0) or 0),
            "posts": int(activity_totals.get("posts", 0) or 0),
            "images": int(activity_totals.get("images", 0) or 0),
            "reels": int(activity_totals.get("reels", 0) or 0),
        },
        "eventStats": source.get(
            "eventStats",
            {
                "totalEvents": 0,
                "approvedEvents": 0,
                "postedEvents": 0,
                "scheduledEvents": 0,
                "failedEvents": 0,
            },
        ),
        "recentActivity": source.get("recentActivity", []),
    }


def _recent_activity(
    users: list[dict[str, Any]],
    calendars: list[dict[str, Any]],
    events: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    users_by_id = {str(user.get("id")): user for user in users}
    calendars_by_id = {str(calendar.get("id")): calendar for calendar in calendars}
    activity: list[dict[str, Any]] = []

    for user in users:
        activity.append(
            {
                "id": f"user-{user.get('id')}",
                "kind": "user_signup",
                "label": "User signup",
                "title": user.get("fullname") or user.get("email") or "New user",
                "email": user.get("email", ""),
                "createdAt": user.get("createdAt"),
                "metadata": user.get("provider", "local"),
            }
        )

    for calendar in calendars:
        user = users_by_id.get(str(calendar.get("userId")), {})
        activity.append(
            {
                "id": f"calendar-{calendar.get('id')}",
                "kind": "calendar_created",
                "label": "Calendar created",
                "title": calendar.get("theme") or calendar.get("month") or "Untitled calendar",
                "email": user.get("email", ""),
                "createdAt": calendar.get("createdAt"),
                "metadata": f"{len(calendar.get('events') or [])} events",
            }
        )

    for event in events:
        calendar = calendars_by_id.get(str(event.get("calendarId")), {})
        user = users_by_id.get(str(calendar.get("userId")), {})
        activity.append(
            {
                "id": f"event-{event.get('id')}",
                "kind": "event_created",
                "label": "Event created",
                "title": event.get("title") or "Untitled event",
                "email": user.get("email", ""),
                "createdAt": event.get("createdAt"),
                "metadata": event.get("postingStatus") or event.get("type") or "draft",
            }
        )

    return sorted(
        [item for item in activity if _parse_date(item.get("createdAt"))],
        key=lambda item: _parse_date(item.get("createdAt")) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )[:18]


def _percent(value: int, total: int) -> float:
    if not total:
        return 0.0
    return round(value / total * 100, 1)
