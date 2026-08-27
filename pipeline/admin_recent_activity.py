from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from pipeline.admin_stats import (
    _is_excluded_admin_email,
    _mongo_client,
    _orkyst_mongo_uri,
)


ACTIVITY_LABELS = {
    "calendar_created": "Calendar created",
    "calendar_archived": "Calendar archived",
    "calendar_restored": "Calendar restored",
    "calendar_deleted": "Calendar deleted",
    "brand_kit_synced": "Brand kit updated",
    "event_created": "Post created",
    "event_updated": "Post updated",
    "event_deleted": "Post deleted",
    "post_approved": "Post approved",
    "approval_removed": "Approval removed",
    "post_scheduled": "Post scheduled",
    "post_published": "Post published",
    "post_failed": "Publishing failed",
}


def _iso(value: Any) -> str | None:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value) if value else None


def _timestamp(value: Any) -> float:
    if not isinstance(value, datetime):
        return float("-inf")
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.timestamp()


def _item_timestamp(item: dict[str, Any]) -> float:
    value = item.get("createdAt")
    if not value:
        return float("-inf")
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return float("-inf")
    return _timestamp(parsed)


def _activity_item(activity: dict[str, Any], users_by_id: dict[str, dict[str, Any]], calendars_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    calendar = calendars_by_id.get(str(activity.get("calendarId")), {})
    user_id = activity.get("userId") or calendar.get("userId")
    user = users_by_id.get(str(user_id), {})
    activity_type = str(activity.get("type") or "activity")
    label = str(ACTIVITY_LABELS.get(activity_type) or activity_type.replace("_", " ").title())
    description = str(activity.get("description") or "").strip()
    content_title = str(activity.get("title") or "").strip()
    generic_titles = {
        activity_type.replace("_", " ").lower(),
        label.lower(),
        "event updated" if activity_type == "event_updated" else "",
    }
    title = description if description and content_title.lower() in generic_titles else content_title or description or label
    email = str(user.get("email") or "")
    platform = str(activity.get("platform") or "").strip()
    context = [value for value in (email, platform.title() if platform else "") if value]
    return {
        "id": str(activity.get("_id") or ""),
        "kind": activity_type,
        "label": label,
        "title": title,
        "email": email,
        "createdAt": _iso(activity.get("createdAt")),
        "metadata": " · ".join(context),
    }


def _signup_item(user: dict[str, Any]) -> dict[str, Any]:
    email = str(user.get("email") or "")
    return {
        "id": f"user-{user.get('_id')}",
        "kind": "user_signup",
        "label": "User signup",
        "title": str(user.get("fullname") or user.get("name") or email or "New user"),
        "email": email,
        "createdAt": _iso(user.get("createdAt")),
        "metadata": str(user.get("provider") or ""),
    }


def list_admin_recent_activity(*, limit: int = 20) -> dict[str, Any]:
    """Read the admin feed from persisted activity records, independently of BullMQ."""
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("MongoDB is not configured for admin recent activity")

    limit = min(100, max(1, limit))
    db = _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]
    activity_projection = {
        "calendarId": 1,
        "userId": 1,
        "type": 1,
        "title": 1,
        "description": 1,
        "platform": 1,
        "createdAt": 1,
    }
    activities = list(
        db["calendaractivities"]
        .find({}, activity_projection)
        .sort("createdAt", -1)
        .limit(limit * 3)
    )

    calendar_ids = {item.get("calendarId") for item in activities if item.get("calendarId")}
    calendars = list(db["calendars"].find({"_id": {"$in": list(calendar_ids)}}, {"userId": 1})) if calendar_ids else []
    calendars_by_id = {str(item.get("_id")): item for item in calendars}

    user_ids = {item.get("userId") for item in activities if item.get("userId")}
    user_ids.update(item.get("userId") for item in calendars if item.get("userId"))
    activity_users = list(
        db["users"].find(
            {"_id": {"$in": list(user_ids)}},
            {"email": 1, "fullname": 1, "name": 1, "provider": 1, "createdAt": 1},
        )
    ) if user_ids else []
    users_by_id = {str(item.get("_id")): item for item in activity_users}

    recent_users = list(
        db["users"]
        .find({}, {"email": 1, "fullname": 1, "name": 1, "provider": 1, "createdAt": 1})
        .sort("createdAt", -1)
        .limit(limit * 2)
    )
    items = [
        _activity_item(item, users_by_id, calendars_by_id)
        for item in activities
    ]
    items.extend(_signup_item(user) for user in recent_users)
    items = [
        item
        for item in items
        if item.get("createdAt") and not _is_excluded_admin_email(item.get("email"))
    ]
    items.sort(key=_item_timestamp, reverse=True)

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": "live",
        "items": items[:limit],
    }


def list_admin_user_recent_activity(user_id: str, *, limit: int = 12) -> list[dict[str, Any]]:
    """Return persisted audit activity scoped to one user only."""
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("MongoDB is not configured for admin user activity")
    try:
        target_user_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return []

    limit = min(100, max(1, limit))
    db = _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]
    user = db["users"].find_one(
        {"_id": target_user_id},
        {"email": 1, "fullname": 1, "name": 1},
    )
    if not user or _is_excluded_admin_email(user.get("email")):
        return []

    calendars = list(
        db["calendars"].find(
            {"userId": target_user_id},
            {"userId": 1},
        )
    )
    calendar_ids = [item["_id"] for item in calendars]
    scope: list[dict[str, Any]] = [{"userId": {"$in": [target_user_id, user_id]}}]
    if calendar_ids:
        scope.append(
            {
                "userId": {"$in": [None, ""]},
                "calendarId": {"$in": calendar_ids},
            }
        )

    activities = list(
        db["calendaractivities"]
        .find(
            {"$or": scope},
            {
                "calendarId": 1,
                "userId": 1,
                "type": 1,
                "title": 1,
                "description": 1,
                "platform": 1,
                "metadata": 1,
                "createdAt": 1,
            },
        )
        .sort("createdAt", -1)
        .limit(limit)
    )
    calendars_by_id = {str(item["_id"]): item for item in calendars}
    users_by_id = {str(target_user_id): user}

    result: list[dict[str, Any]] = []
    for activity in activities:
        item = _activity_item(activity, users_by_id, calendars_by_id)
        metadata = activity.get("metadata") if isinstance(activity.get("metadata"), dict) else {}
        result.append(
            {
                "id": item["id"],
                "type": item["kind"],
                "label": item["label"],
                "title": item["title"],
                "status": str(metadata.get("status") or "") or None,
                "platform": str(activity.get("platform") or "") or None,
                "createdAt": item["createdAt"],
            }
        )
    return result
