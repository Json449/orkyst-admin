from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).parent.parent
DEFAULT_ADMIN_DATA = ROOT / "admin_sample_data.json"
LOOKBACK_DAYS = 30
PLATFORMS = ("facebook", "instagram", "twitter", "linkedin")


def load_admin_source(json_path: str | Path = DEFAULT_ADMIN_DATA) -> dict[str, Any]:
    """Load live admin data when configured, otherwise use local sample data."""
    live_url = os.getenv("ORKYST_ADMIN_STATS_URL")
    if live_url:
        try:
            return _load_from_url(live_url)
        except URLError as exc:
            raise RuntimeError(f"Failed to load ORKYST_ADMIN_STATS_URL: {exc}") from exc

    path = Path(json_path)
    return json.loads(path.read_text())


def build_admin_stats(source: dict[str, Any] | None = None) -> dict[str, Any]:
    source = source or load_admin_source()
    users = source.get("users", [])
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

    return {
        "generatedAt": now.isoformat(),
        "source": "live" if os.getenv("ORKYST_ADMIN_STATS_URL") else "sample",
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


def _load_from_url(url: str) -> dict[str, Any]:
    headers = {"Accept": "application/json"}
    token = os.getenv("ORKYST_ADMIN_API_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"

    request = Request(url, headers=headers)
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def _parse_date(value: Any) -> datetime | None:
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
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


def _percent(value: int, total: int) -> float:
    if not total:
        return 0.0
    return round(value / total * 100, 1)
