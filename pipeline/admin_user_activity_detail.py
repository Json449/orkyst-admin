from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from pipeline.admin_recent_activity import ACTIVITY_LABELS
from pipeline.admin_stats import _is_excluded_admin_email, _mongo_client, _orkyst_mongo_uri


EVENT_ACTIVITY_PREFIXES = (
    "generated-image-",
    "created-reel-",
    "created-post-",
    "scheduled-",
    "published-",
)


def get_admin_user_activity_detail(user_id: str, activity_id: str) -> dict[str, Any] | None:
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("MongoDB is not configured for admin activity details")
    try:
        target_user_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return None

    db = _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]
    user = db["users"].find_one({"_id": target_user_id}, {"email": 1, "fullname": 1, "name": 1})
    if not user or _is_excluded_admin_email(user.get("email")):
        return None

    activity = None
    event = None
    version = None
    campaign = None
    source_type = "activity"

    if activity_id.startswith("activity-"):
        activity = _find_by_id(db["calendaractivities"], activity_id.removeprefix("activity-"))
        if not activity or not _activity_belongs_to_user(db, activity, target_user_id, str(user_id)):
            return None
        if activity.get("eventId"):
            event = db["events"].find_one({"_id": activity["eventId"]})
    elif activity_id.startswith("version-"):
        source_type = "version"
        version = _find_by_id(db["versionhistories"], activity_id.removeprefix("version-"))
        if not version or str(version.get("updatedBy") or "") not in {str(target_user_id), str(user_id)}:
            return None
        if version.get("eventId"):
            event = db["events"].find_one({"_id": version["eventId"]})
    elif activity_id.startswith("campaign-"):
        source_type = "campaign"
        campaign = _find_by_id(db["enterprisecampaigns"], activity_id.removeprefix("campaign-"))
        if not campaign or str(campaign.get("ownerUserId") or "") not in {str(target_user_id), str(user_id)}:
            return None
    else:
        for prefix in EVENT_ACTIVITY_PREFIXES:
            if activity_id.startswith(prefix):
                source_type = "event"
                event = _find_by_id(db["events"], activity_id.removeprefix(prefix))
                break
        if not event:
            return None

    if event and not _event_belongs_to_user(db, event, target_user_id, str(user_id)):
        return None

    calendar = None
    calendar_id = (event or activity or {}).get("calendarId")
    if calendar_id:
        calendar = db["calendars"].find_one(
            {"_id": calendar_id},
            {"theme": 1, "month": 1, "status": 1, "userId": 1, "createdAt": 1},
        )

    activity_type = str((activity or {}).get("type") or _activity_type_from_id(activity_id) or source_type)
    title = _first_text(
        (event or {}).get("title"),
        (activity or {}).get("description"),
        (activity or {}).get("title"),
        (campaign or {}).get("name"),
        "Activity detail",
    )

    return {
        "id": activity_id,
        "sourceType": source_type,
        "activityType": activity_type,
        "label": ACTIVITY_LABELS.get(activity_type) or activity_type.replace("_", " ").title(),
        "title": title,
        "description": _first_text((event or {}).get("description"), (activity or {}).get("description")),
        "createdAt": _iso((activity or version or event or campaign or {}).get("createdAt")),
        "updatedAt": _iso((activity or version or event or campaign or {}).get("updatedAt")),
        "user": {
            "id": str(user["_id"]),
            "email": str(user.get("email") or ""),
            "fullname": str(user.get("fullname") or user.get("name") or ""),
        },
        "activity": _serialize_doc(activity),
        "event": _event_summary(event),
        "calendar": _calendar_summary(calendar),
        "version": _serialize_doc(version),
        "campaign": _serialize_doc(campaign),
    }


def _find_by_id(collection: Any, value: str) -> dict[str, Any] | None:
    try:
        return collection.find_one({"_id": ObjectId(value)})
    except (InvalidId, TypeError):
        return None


def _activity_belongs_to_user(db: Any, activity: dict[str, Any], target_user_id: ObjectId, user_id: str) -> bool:
    if str(activity.get("userId") or "") in {str(target_user_id), user_id}:
        return True
    calendar_id = activity.get("calendarId")
    return bool(calendar_id and db["calendars"].find_one({"_id": calendar_id, "userId": target_user_id}, {"_id": 1}))


def _event_belongs_to_user(db: Any, event: dict[str, Any], target_user_id: ObjectId, user_id: str) -> bool:
    publishing_users = [
        item.get("publishingUserId")
        for item in event.get("publications", [])
        if isinstance(item, dict)
    ]
    if any(str(item or "") in {str(target_user_id), user_id} for item in publishing_users):
        return True
    calendar_id = event.get("calendarId")
    return bool(calendar_id and db["calendars"].find_one({"_id": calendar_id, "userId": target_user_id}, {"_id": 1}))


def _event_summary(event: dict[str, Any] | None) -> dict[str, Any] | None:
    if not event:
        return None
    keys = [
        "_id",
        "title",
        "description",
        "type",
        "postingStatus",
        "isApproved",
        "scheduledAt",
        "postedAt",
        "postingError",
        "postLink",
        "artwork",
        "reelUrl",
        "date",
        "startTime",
        "endTime",
        "createdAt",
        "updatedAt",
    ]
    return {("id" if key == "_id" else key): _serialize_value(event.get(key)) for key in keys if key in event}


def _calendar_summary(calendar: dict[str, Any] | None) -> dict[str, Any] | None:
    if not calendar:
        return None
    return {
        "id": str(calendar.get("_id") or ""),
        "theme": str(calendar.get("theme") or calendar.get("month") or ""),
        "status": str(calendar.get("status") or ""),
        "createdAt": _iso(calendar.get("createdAt")),
    }


def _serialize_doc(value: dict[str, Any] | None) -> dict[str, Any] | None:
    if not value:
        return None
    return {("id" if key == "_id" else key): _serialize_value(item) for key, item in value.items()}


def _serialize_value(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return _iso(value)
    if isinstance(value, list):
        return [_serialize_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _serialize_value(item) for key, item in value.items()}
    return value


def _iso(value: Any) -> str | None:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value) if value else None


def _first_text(*values: Any) -> str:
    for value in values:
        text = str(value or "").strip()
        if text:
            return text
    return ""


def _activity_type_from_id(activity_id: str) -> str:
    for prefix in EVENT_ACTIVITY_PREFIXES:
        if activity_id.startswith(prefix):
            return prefix.removesuffix("-").replace("-", "_")
    return re.sub(r"-[a-f0-9]{24}$", "", activity_id).replace("-", "_")
