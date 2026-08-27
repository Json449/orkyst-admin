from __future__ import annotations

import math
import os
import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from pipeline.admin_recent_activity import list_admin_user_recent_activity
from pipeline.admin_stats import (
    _connected_platforms,
    _excluded_admin_emails,
    _is_excluded_admin_email,
    _mongo_client,
    _normalize_activity,
    _orkyst_mongo_uri,
    _parse_date,
    _serialize_mongo_user,
    load_admin_source,
    load_admin_users_source,
)


def _user_id(user: dict[str, Any]) -> str:
    return str(user.get("id") or user.get("_id") or "")


def _status(user: dict[str, Any]) -> str:
    if str(user.get("accountStatus") or "").strip().lower() == "deactivated":
        return "suspended"
    explicit = str(user.get("status") or "").strip().lower()
    if explicit in {"active", "onboarding", "pending", "suspended"}:
        return explicit
    if not user.get("isVerified"):
        return "pending"
    if not user.get("isOnboardingCompleted"):
        return "onboarding"
    return "active"


def _activity(user: dict[str, Any]) -> dict[str, int]:
    explicit = user.get("activityCounts")
    if isinstance(explicit, dict):
        return _normalize_activity(explicit)
    return {
        "calendars": int(user.get("calendarsGeneratedThisMonth", 0) or 0),
        "posts": int(user.get("socialPostsGeneratedThisMonth", 0) or 0),
        "images": int(user.get("imagesGeneratedThisMonth", 0) or 0),
        "reels": int(user.get("reelUsageThisMonth", 0) or 0),
    }


def _serialize_user(user: dict[str, Any]) -> dict[str, Any]:
    """Return only fields that are safe and useful in the admin UI."""
    return {
        "id": _user_id(user),
        "email": str(user.get("email") or ""),
        "fullname": str(user.get("fullname") or user.get("name") or ""),
        "company": str(user.get("company") or ""),
        "avatar": user.get("avatar"),
        "accountStatus": str(user.get("accountStatus") or "active"),
        "provider": str(user.get("provider") or "local"),
        "plan": str(user.get("plan") or "basic"),
        "billingProvider": str(user.get("billingProvider") or "orkyst"),
        "subscriptionStatus": str(user.get("subscriptionStatus") or "none"),
        "status": _status(user),
        "isVerified": bool(user.get("isVerified")),
        "isOnboardingCompleted": bool(user.get("isOnboardingCompleted")),
        "createdAt": user.get("createdAt"),
        "updatedAt": user.get("updatedAt"),
        "onboardingCompletedAt": user.get("onboardingCompletedAt"),
        "lastLoginAt": user.get("lastLoginAt") or user.get("antLastSsoAt"),
        "subscriptionCurrentPeriodStart": user.get("subscriptionCurrentPeriodStart"),
        "subscriptionCurrentPeriodEnd": user.get("subscriptionCurrentPeriodEnd"),
        "connectedPlatforms": _connected_platforms(user),
        "activityCounts": _activity(user),
    }


def _source_data(source: dict[str, Any] | None = None) -> dict[str, Any]:
    data = source or load_admin_source()
    if "result" in data and isinstance(data["result"], dict):
        data = data["result"]
    return data


def _users_source_data(source: dict[str, Any] | None = None) -> dict[str, Any]:
    data = source if source is not None else load_admin_users_source()
    if "result" in data and isinstance(data["result"], dict):
        data = data["result"]
    return data


def _mongo_status_stage() -> dict[str, Any]:
    valid_statuses = ["active", "onboarding", "pending", "suspended"]
    return {
        "$set": {
            "_adminStatus": {
                "$let": {
                    "vars": {"explicit": {"$toLower": {"$ifNull": ["$status", ""]}}},
                    "in": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {
                                        "$eq": [
                                            {"$toLower": {"$ifNull": ["$accountStatus", "active"]}},
                                            "deactivated",
                                        ]
                                    },
                                    "then": "suspended",
                                },
                                {"case": {"$in": ["$$explicit", valid_statuses]}, "then": "$$explicit"},
                                {"case": {"$ne": ["$isVerified", True]}, "then": "pending"},
                                {"case": {"$ne": ["$isOnboardingCompleted", True]}, "then": "onboarding"},
                            ],
                            "default": "active",
                        }
                    },
                }
            }
        }
    }


def _mongo_base_match() -> dict[str, Any]:
    return {
        "$match": {
            "$expr": {
                "$not": [
                    {
                        "$in": [
                            {"$toLower": {"$ifNull": ["$email", ""]}},
                            sorted(_excluded_admin_emails()),
                        ]
                    }
                ]
            }
        }
    }


def _mongo_filters(query: str, status: str, plan: str, provider: str) -> dict[str, Any]:
    filters: list[dict[str, Any]] = []
    needle = query.strip()
    if needle:
        pattern = re.compile(re.escape(needle), re.IGNORECASE)
        filters.append(
            {"$or": [{field: pattern} for field in ("fullname", "name", "email", "company")]}
        )
    if status != "all":
        filters.append({"_adminStatus": status})
    if plan != "all":
        filters.append({"plan": re.compile(f"^{re.escape(plan)}$", re.IGNORECASE)})
    if provider != "all":
        filters.append({"provider": re.compile(f"^{re.escape(provider)}$", re.IGNORECASE)})
    return {"$match": {"$and": filters}} if filters else {"$match": {}}


def _list_mongo_admin_users(
    *, query: str, status: str, plan: str, provider: str, page: int, page_size: int
) -> dict[str, Any]:
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("MongoDB is not configured")

    collection = _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]["users"]
    status_stage = _mongo_status_stage()
    common = [_mongo_base_match(), status_stage, _mongo_filters(query, status, plan, provider)]

    total_result = list(collection.aggregate([*common, {"$count": "total"}]))
    total = int(total_result[0]["total"]) if total_result else 0
    pages = max(1, math.ceil(total / page_size))
    page = min(max(1, page), pages)

    projection = {
        "email": 1,
        "fullname": 1,
        "name": 1,
        "company": 1,
        "avatar": 1,
        "accountStatus": 1,
        "provider": 1,
        "plan": 1,
        "billingProvider": 1,
        "subscriptionStatus": 1,
        "status": 1,
        "isVerified": 1,
        "isOnboardingCompleted": 1,
        "createdAt": 1,
        "updatedAt": 1,
        "onboardingCompletedAt": 1,
        "lastLoginAt": 1,
        "antLastSsoAt": 1,
        "subscriptionCurrentPeriodStart": 1,
        "subscriptionCurrentPeriodEnd": 1,
        "connectedPlatforms": 1,
        "facebookConnectionStatus": 1,
        "instagramConnectionStatus": 1,
        "twitterConnectionStatus": 1,
        "linkedinConnectionStatus": 1,
    }
    documents = list(
        collection.aggregate(
            [
                *common,
                {"$sort": {"createdAt": -1, "_id": -1}},
                {"$skip": (page - 1) * page_size},
                {"$limit": page_size},
                {"$project": projection},
            ]
        )
    )

    status_counts = {"all": 0, "active": 0, "onboarding": 0, "pending": 0, "suspended": 0}
    grouped_statuses = collection.aggregate(
        [
            _mongo_base_match(),
            status_stage,
            {"$group": {"_id": "$_adminStatus", "count": {"$sum": 1}}},
        ]
    )
    for item in grouped_statuses:
        key = str(item.get("_id") or "")
        if key in status_counts:
            status_counts[key] = int(item.get("count", 0))
    status_counts["all"] = sum(status_counts[key] for key in status_counts if key != "all")

    return {
        "items": [_serialize_user(_serialize_mongo_user(document)) for document in documents],
        "pagination": {
            "page": page,
            "pageSize": page_size,
            "total": total,
            "pages": pages,
            "hasPrevious": page > 1,
            "hasNext": page < pages,
        },
        "statusCounts": status_counts,
    }


def list_admin_users(
    *,
    source: dict[str, Any] | None = None,
    query: str = "",
    status: str = "all",
    plan: str = "all",
    provider: str = "all",
    page: int = 1,
    page_size: int = 10,
) -> dict[str, Any]:
    page = max(1, page)
    page_size = min(100, max(1, page_size))
    normalized_status = status.strip().lower()
    normalized_plan = plan.strip().lower()
    normalized_provider = provider.strip().lower()

    if source is None and not os.getenv("ORKYST_ADMIN_STATS_URL") and _orkyst_mongo_uri():
        return _list_mongo_admin_users(
            query=query,
            status=normalized_status,
            plan=normalized_plan,
            provider=normalized_provider,
            page=page,
            page_size=page_size,
        )

    data = _users_source_data(source)
    users = [
        _serialize_user(user)
        for user in data.get("users", data.get("recentUsers", []))
        if not _is_excluded_admin_email(user.get("email"))
    ]

    needle = query.strip().lower()
    def matches(user: dict[str, Any]) -> bool:
        text = " ".join((user["fullname"], user["email"], user["company"])).lower()
        return (
            (not needle or needle in text)
            and (normalized_status == "all" or user["status"] == normalized_status)
            and (normalized_plan == "all" or user["plan"].lower() == normalized_plan)
            and (normalized_provider == "all" or user["provider"].lower() == normalized_provider)
        )

    filtered = [user for user in users if matches(user)]
    filtered.sort(
        key=lambda user: _parse_date(user.get("createdAt"))
        or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )

    total = len(filtered)
    pages = max(1, math.ceil(total / page_size))
    page = min(page, pages)
    start = (page - 1) * page_size

    status_counts = {"all": len(users), "active": 0, "onboarding": 0, "pending": 0, "suspended": 0}
    for user in users:
        status_counts[user["status"]] = status_counts.get(user["status"], 0) + 1

    return {
        "items": filtered[start : start + page_size],
        "pagination": {
            "page": page,
            "pageSize": page_size,
            "total": total,
            "pages": pages,
            "hasPrevious": page > 1,
            "hasNext": page < pages,
        },
        "statusCounts": status_counts,
    }


def _get_mongo_admin_user(user_id: str) -> dict[str, Any] | None:
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("MongoDB is not configured")
    try:
        target_user_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return None

    db = _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]
    user = db["users"].find_one({"_id": target_user_id})
    if not user or _is_excluded_admin_email(user.get("email")):
        return None

    result = _serialize_user(_serialize_mongo_user(user))
    calendar_ids = [
        item["_id"]
        for item in db["calendars"].find({"userId": target_user_id}, {"_id": 1})
    ]
    event_scope = {"calendarId": {"$in": calendar_ids}} if calendar_ids else {"_id": None}
    events = db["events"]
    result["activityCounts"] = {
        "calendars": len(calendar_ids),
        "posts": events.count_documents(event_scope),
        "images": events.count_documents({**event_scope, "artwork": {"$nin": [None, ""]}}),
        "reels": events.count_documents(
            {
                **event_scope,
                "$or": [
                    {"reelUrl": {"$nin": [None, ""]}},
                    {"reel": {"$nin": [None, ""]}},
                ],
            }
        ),
    }
    result["recentActivity"] = list_admin_user_recent_activity(user_id, limit=12)
    return result


def get_admin_user(user_id: str, source: dict[str, Any] | None = None) -> dict[str, Any] | None:
    if source is None and not os.getenv("ORKYST_ADMIN_STATS_URL") and _orkyst_mongo_uri():
        return _get_mongo_admin_user(user_id)

    data = _source_data(source)
    users = data.get("users", data.get("recentUsers", []))
    user = next(
        (
            item
            for item in users
            if _user_id(item) == user_id and not _is_excluded_admin_email(item.get("email"))
        ),
        None,
    )
    if not user:
        return None

    result = _serialize_user(user)
    calendars = [
        calendar
        for calendar in data.get("calendars", [])
        if str(calendar.get("userId") or "") == user_id
    ]
    calendar_ids = {str(calendar.get("id") or calendar.get("_id") or "") for calendar in calendars}
    events = [
        event
        for event in data.get("events", [])
        if str(event.get("calendarId") or "") in calendar_ids
    ]

    if calendars or events:
        result["activityCounts"] = {
            **result["activityCounts"],
            "calendars": len(calendars),
            "posts": len(events),
            "images": sum(1 for event in events if event.get("artwork")),
            "reels": sum(1 for event in events if event.get("reelUrl") or event.get("reel")),
        }

    recent_activity = []
    for calendar in calendars:
        recent_activity.append(
            {
                "id": f"calendar-{calendar.get('id') or calendar.get('_id')}",
                "type": "calendar",
                "title": calendar.get("theme") or calendar.get("month") or "Calendar created",
                "createdAt": calendar.get("createdAt"),
            }
        )
    for event in events:
        recent_activity.append(
            {
                "id": f"event-{event.get('id') or event.get('_id')}",
                "type": "event",
                "title": event.get("title") or "Event created",
                "status": event.get("postingStatus") or "draft",
                "createdAt": event.get("createdAt"),
            }
        )
    recent_activity.sort(
        key=lambda item: _parse_date(item.get("createdAt"))
        or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )
    result["recentActivity"] = recent_activity[:12]
    return result


def set_admin_user_account_status(user_id: str, *, active: bool) -> dict[str, Any] | None:
    """Activate or deactivate a real Orkyst user account from the protected admin app."""
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("Live MongoDB access is required to update an account")
    try:
        target_user_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return None

    collection = _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]["users"]
    user = collection.find_one({"_id": target_user_id}, {"email": 1})
    if not user or _is_excluded_admin_email(user.get("email")):
        return None

    account_status = "active" if active else "deactivated"
    collection.update_one(
        {"_id": target_user_id},
        {"$set": {"accountStatus": account_status, "updatedAt": datetime.now(timezone.utc)}},
    )
    updated = collection.find_one({"_id": target_user_id})
    return _serialize_user(_serialize_mongo_user(updated)) if updated else None
