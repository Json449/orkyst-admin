from __future__ import annotations

import math
import os
from collections import defaultdict
from datetime import datetime, time as datetime_time, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from pipeline.admin_stats import _is_excluded_admin_email, _mongo_client, _orkyst_mongo_uri


CONTENT_TYPES = ("post", "artwork", "reel", "asset")
ACTIVITY_LABELS = {
    "calendar_created": "Created calendar",
    "calendar_archived": "Archived calendar",
    "calendar_restored": "Restored calendar",
    "calendar_deleted": "Deleted calendar",
    "brand_kit_synced": "Updated brand kit",
    "event_created": "Created post",
    "event_updated": "Updated post",
    "event_deleted": "Deleted post",
    "post_approved": "Approved content",
    "approval_removed": "Removed content approval",
    "post_scheduled": "Scheduled content",
    "post_published": "Published content",
    "post_failed": "Content publishing failed",
    "generated_image": "Generated image",
    "created_reel": "Created reel",
    "post_edited": "Edited post",
    "social_connected": "Connected social account",
    "campaign_updated": "Updated campaign",
    "media_created": "Created media asset",
}


def _iso(value: Any) -> str | None:
    if not isinstance(value, datetime):
        return str(value) if value else None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()


def _timestamp(value: Any) -> float:
    if not isinstance(value, datetime):
        return float("-inf")
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.timestamp()


def _date(value: str | None, *, end: bool = False) -> datetime | None:
    if not value:
        return None
    try:
        if len(value) == 10:
            parsed = datetime.fromisoformat(value).date()
            return datetime.combine(
                parsed,
                datetime_time.max if end else datetime_time.min,
                tzinfo=timezone.utc,
            )
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.astimezone(timezone.utc) if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _in_range(value: Any, start: datetime | None, end: datetime | None) -> bool:
    if not isinstance(value, datetime):
        return not start and not end
    normalized = value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
    return (not start or normalized >= start) and (not end or normalized <= end)


def _date_query(start: datetime | None, end: datetime | None) -> dict[str, Any]:
    bounds: dict[str, Any] = {}
    if start:
        bounds["$gte"] = start
    if end:
        bounds["$lte"] = end
    return {"createdAt": bounds} if bounds else {}


def _platforms(event: dict[str, Any]) -> list[str]:
    found: set[str] = set()
    explicit = str(event.get("externalPlatform") or "").strip().lower()
    if explicit:
        found.add(explicit)
    event_type = str(event.get("type") or "").lower()
    for platform in ("facebook", "instagram", "linkedin", "twitter", "tiktok"):
        if platform in event_type:
            found.add(platform)
    if event.get("instagramPublishType"):
        found.add("instagram")
    if event.get("facebookPublishType"):
        found.add("facebook")
    for publication in event.get("publications") or []:
        platform = str(publication.get("platform") or "").strip().lower()
        if platform:
            found.add(platform)
    return sorted(found)


def _primary_platform(event: dict[str, Any]) -> str | None:
    values = _platforms(event)
    return values[0] if values else None


def _campaign_name(calendar: dict[str, Any]) -> str:
    return str(calendar.get("theme") or calendar.get("month") or "Content calendar")


def _event_content_types(event: dict[str, Any]) -> set[str]:
    types = {"post"}
    if event.get("artwork"):
        types.add("artwork")
    if event.get("reelUrl"):
        types.add("reel")
    if event.get("productImages"):
        types.add("asset")
    return types


def _paginate(items: list[dict[str, Any]], page: int, page_size: int) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    page_size = min(100, max(1, page_size))
    total = len(items)
    pages = max(1, math.ceil(total / page_size))
    page = min(max(1, page), pages)
    start = (page - 1) * page_size
    return items[start : start + page_size], {
        "page": page,
        "pageSize": page_size,
        "total": total,
        "pages": pages,
        "hasPrevious": page > 1,
        "hasNext": page < pages,
    }


def _gallery_items(
    events: list[dict[str, Any]],
    media: list[dict[str, Any]],
    calendars: dict[str, dict[str, Any]],
    content_type: str,
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for event in events:
        event_id = str(event["_id"])
        calendar_id = str(event.get("calendarId") or "")
        calendar = calendars.get(calendar_id, {})
        common = {
            "title": str(event.get("title") or "Untitled content"),
            "createdAt": _iso(event.get("createdAt")),
            "status": str(event.get("postingStatus") or "draft"),
            "platform": _primary_platform(event),
            "campaignId": calendar_id or None,
            "campaignName": _campaign_name(calendar) if calendar else "Unassigned",
            "postUrl": event.get("postLink"),
        }
        # The mixed "All" gallery is reserved for real visual assets. Posts
        # have their own tab and may only contain text or an external post URL,
        # neither of which can be rendered as an image preview.
        if content_type == "post":
            preview = event.get("artwork") or event.get("reelUrl") or event.get("postLink")
            items.append({
                **common,
                "id": f"post-{event_id}",
                "contentType": "post",
                "mediaKind": "video" if event.get("reelUrl") else "image" if event.get("artwork") else "link" if event.get("postLink") else "text",
                "url": preview,
                "thumbnailUrl": event.get("artwork") or None,
            })
        if event.get("artwork") and content_type in {"all", "artwork"}:
            items.append({
                **common,
                "id": f"artwork-{event_id}",
                "contentType": "artwork",
                "mediaKind": "image",
                "url": event["artwork"],
                "thumbnailUrl": event["artwork"],
            })
        if event.get("reelUrl") and content_type in {"all", "reel"}:
            items.append({
                **common,
                "id": f"reel-{event_id}",
                "contentType": "reel",
                "mediaKind": "video",
                "url": event["reelUrl"],
                "thumbnailUrl": event.get("artwork") or None,
            })
        if content_type in {"all", "asset"}:
            for index, asset in enumerate(event.get("productImages") or []):
                url = asset.get("url") if isinstance(asset, dict) else None
                if url:
                    items.append({
                        **common,
                        "id": f"asset-{event_id}-{index}",
                        "contentType": "asset",
                        "mediaKind": "image",
                        "url": url,
                        "thumbnailUrl": url,
                    })

    if content_type in {"all", "asset", "artwork", "reel"}:
        for item in media:
            media_type = str(item.get("type") or "").lower()
            is_video = "video" in media_type or "reel" in media_type or str(item.get("url") or "").lower().endswith((".mp4", ".mov", ".webm"))
            item_type = "reel" if is_video else "artwork" if "image" in media_type else "asset"
            if content_type not in {"all", "asset", item_type}:
                continue
            items.append({
                "id": f"media-{item['_id']}",
                "title": str(item.get("name") or "Generated media"),
                "contentType": item_type,
                "mediaKind": "video" if is_video else "image",
                "url": item.get("url"),
                "thumbnailUrl": None if is_video else item.get("url"),
                "createdAt": _iso(item.get("createdAt")),
                "status": "generated",
                "platform": None,
                "campaignId": None,
                "campaignName": "Media library",
                "postUrl": None,
            })
    items.sort(key=lambda item: item.get("createdAt") or "", reverse=True)
    return items


def get_admin_user_analytics(
    user_id: str,
    *,
    date_from: str | None = None,
    date_to: str | None = None,
    content_type: str = "all",
    activity_type: str = "all",
    platform: str = "all",
    campaign_id: str = "all",
    gallery_page: int = 1,
    gallery_page_size: int = 12,
    activity_page: int = 1,
    activity_page_size: int = 20,
) -> dict[str, Any] | None:
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("MongoDB is not configured")
    try:
        target_user_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        return None

    db = _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]
    user = db["users"].find_one(
        {"_id": target_user_id},
        {
            "email": 1,
            "fullname": 1,
            "name": 1,
            "lastLoginAt": 1,
            "antLastSsoAt": 1,
            "updatedAt": 1,
            "facebookConnectionStatus": 1,
            "instagramConnectionStatus": 1,
            "twitterConnectionStatus": 1,
            "linkedinConnectionStatus": 1,
        },
    )
    if not user or _is_excluded_admin_email(user.get("email")):
        return None

    start = _date(date_from)
    end = _date(date_to, end=True)
    normalized_content = content_type.strip().lower()
    normalized_activity = activity_type.strip().lower()
    normalized_platform = platform.strip().lower()
    normalized_campaign = campaign_id.strip()
    if normalized_content not in {"all", *CONTENT_TYPES}:
        normalized_content = "all"

    owned_calendars = list(
        db["calendars"].find(
            {"userId": target_user_id},
            {"theme": 1, "month": 1, "status": 1, "createdAt": 1, "updatedAt": 1},
        )
    )
    owned_calendar_ids = {item["_id"] for item in owned_calendars}

    direct_activities = list(
        db["calendaractivities"].find(
            {"userId": target_user_id, **_date_query(start, end)},
            {"calendarId": 1, "eventId": 1, "type": 1, "title": 1, "description": 1, "platform": 1, "metadata": 1, "createdAt": 1},
        )
    )
    versions = list(
        db["versionhistories"].find(
            {"updatedBy": target_user_id, **_date_query(start, end)},
            {"eventId": 1, "version": 1, "changes": 1, "updatedAt": 1, "createdAt": 1},
        )
    )
    actor_event_ids = {item.get("eventId") for item in direct_activities if item.get("eventId")}
    actor_event_ids.update(item.get("eventId") for item in versions if item.get("eventId"))
    activity_calendar_ids = {item.get("calendarId") for item in direct_activities if item.get("calendarId")}

    explicit_event_scope: list[dict[str, Any]] = [{"publications.publishingUserId": target_user_id}]
    if actor_event_ids:
        explicit_event_scope.append({"_id": {"$in": list(actor_event_ids)}})
    explicit_events = list(
        db["events"].find(
            {"$or": explicit_event_scope},
            {"calendarId": 1},
        )
    )
    actor_event_ids.update(item["_id"] for item in explicit_events)
    actor_event_calendar_ids = {
        item.get("calendarId") for item in explicit_events if item.get("calendarId")
    }

    related_calendar_ids = owned_calendar_ids | activity_calendar_ids | actor_event_calendar_ids
    related_calendars = list(
        db["calendars"].find(
            {"_id": {"$in": list(related_calendar_ids)}},
            {"theme": 1, "month": 1, "status": 1, "createdAt": 1, "updatedAt": 1},
        )
    ) if related_calendar_ids else []
    calendars_by_id = {str(item["_id"]): item for item in related_calendars}

    selected_calendar_ids = related_calendar_ids
    if normalized_campaign != "all":
        try:
            selected_id = ObjectId(normalized_campaign)
            selected_calendar_ids = {selected_id} if selected_id in related_calendar_ids else set()
        except (InvalidId, TypeError):
            selected_calendar_ids = set()

    event_scope: list[dict[str, Any]] = []
    if selected_calendar_ids:
        owned_selected = selected_calendar_ids & owned_calendar_ids
        if owned_selected:
            event_scope.append({"calendarId": {"$in": list(owned_selected)}})
        selected_actor_events = actor_event_ids
        if normalized_campaign != "all":
            selected_actor_events = {
                item.get("eventId")
                for item in direct_activities
                if item.get("eventId") and item.get("calendarId") in selected_calendar_ids
            }
            selected_actor_events.update(item.get("eventId") for item in versions if item.get("eventId"))
        if selected_actor_events:
            event_scope.append({"_id": {"$in": list(selected_actor_events)}})
        event_scope.append({
            "calendarId": {"$in": list(selected_calendar_ids)},
            "publications.publishingUserId": target_user_id,
        })

    event_query: dict[str, Any] = {"$or": event_scope, **_date_query(start, end)} if event_scope else {"_id": None}
    events = list(
        db["events"].find(
            event_query,
            {
                "title": 1,
                "description": 1,
                "type": 1,
                "artwork": 1,
                "reelUrl": 1,
                "postLink": 1,
                "productImages": 1,
                "postingStatus": 1,
                "externalPlatform": 1,
                "instagramPublishType": 1,
                "facebookPublishType": 1,
                "publications": 1,
                "calendarId": 1,
                "scheduledAt": 1,
                "postedAt": 1,
                "createdAt": 1,
                "updatedAt": 1,
            },
        )
    )
    if normalized_campaign != "all":
        events = [event for event in events if event.get("calendarId") in selected_calendar_ids]
    if normalized_platform != "all":
        events = [event for event in events if normalized_platform in _platforms(event)]
    media_query = {"createdBy": target_user_id, **_date_query(start, end)}
    media = list(db["enterprisemedias"].find(media_query, {"url": 1, "name": 1, "type": 1, "createdAt": 1}))
    if normalized_campaign != "all" or normalized_platform != "all":
        media = []

    all_gallery_items = _gallery_items(events, media, calendars_by_id, "all")
    gallery_counts = {
        content: len(_gallery_items(events, media, calendars_by_id, content))
        for content in CONTENT_TYPES
    }
    gallery_counts["all"] = len(all_gallery_items)

    if normalized_content != "all":
        events = [event for event in events if normalized_content in _event_content_types(event)]

    campaigns = list(
        db["enterprisecampaigns"].find(
            {"ownerUserId": target_user_id, **_date_query(start, end)},
            {"name": 1, "status": 1, "channels": 1, "createdAt": 1, "updatedAt": 1},
        )
    )

    gallery = _gallery_items(events, media, calendars_by_id, normalized_content)
    gallery_page_items, gallery_pagination = _paginate(gallery, gallery_page, gallery_page_size)

    activities: list[dict[str, Any]] = []
    for item in direct_activities:
        item_platform = str(item.get("platform") or "").lower() or None
        if normalized_platform != "all" and item_platform != normalized_platform:
            continue
        calendar_id = str(item.get("calendarId") or "")
        if normalized_campaign != "all" and calendar_id != normalized_campaign:
            continue
        action_type = str(item.get("type") or "activity")
        activities.append({
            "id": f"activity-{item['_id']}",
            "activityType": action_type,
            "title": str(item.get("title") or ACTIVITY_LABELS.get(action_type, action_type.replace("_", " ").title())),
            "description": str(item.get("description") or ""),
            "createdAt": _iso(item.get("createdAt")),
            "platform": item_platform,
            "campaignId": calendar_id or None,
            "campaignName": _campaign_name(calendars_by_id.get(calendar_id, {})) if calendar_id else None,
            "status": str((item.get("metadata") or {}).get("status") or "") or None,
        })

    event_by_id = {str(item["_id"]): item for item in events}
    filtered_versions = [item for item in versions if str(item.get("eventId")) in event_by_id]
    for event in events:
        event_id = str(event["_id"])
        calendar_id = str(event.get("calendarId") or "")
        common = {
            "description": str(event.get("title") or "Untitled content"),
            "platform": _primary_platform(event),
            "campaignId": calendar_id or None,
            "campaignName": _campaign_name(calendars_by_id.get(calendar_id, {})) if calendar_id else None,
            "status": str(event.get("postingStatus") or "draft"),
        }
        if event.get("artwork"):
            activities.append({"id": f"generated-image-{event_id}", "activityType": "generated_image", "title": ACTIVITY_LABELS["generated_image"], "createdAt": _iso(event.get("createdAt")), **common})
        if event.get("reelUrl"):
            activities.append({"id": f"created-reel-{event_id}", "activityType": "created_reel", "title": ACTIVITY_LABELS["created_reel"], "createdAt": _iso(event.get("createdAt")), **common})
        if not event.get("artwork") and not event.get("reelUrl"):
            activities.append({"id": f"created-post-{event_id}", "activityType": "event_created", "title": ACTIVITY_LABELS["event_created"], "createdAt": _iso(event.get("createdAt")), **common})
        if event.get("scheduledAt"):
            activities.append({"id": f"scheduled-{event_id}", "activityType": "post_scheduled", "title": ACTIVITY_LABELS["post_scheduled"], "createdAt": _iso(event.get("scheduledAt")), **common})
        if event.get("postedAt"):
            activities.append({"id": f"published-{event_id}", "activityType": "post_published", "title": ACTIVITY_LABELS["post_published"], "createdAt": _iso(event.get("postedAt")), **common})

    for item in filtered_versions:
        event = event_by_id.get(str(item.get("eventId")), {})
        calendar_id = str(event.get("calendarId") or "")
        if normalized_campaign != "all" and calendar_id != normalized_campaign:
            continue
        event_platform = _primary_platform(event)
        if normalized_platform != "all" and event_platform != normalized_platform:
            continue
        activities.append({
            "id": f"version-{item['_id']}",
            "activityType": "post_edited",
            "title": ACTIVITY_LABELS["post_edited"],
            "description": str(event.get("title") or f"Content version {item.get('version', '')}").strip(),
            "createdAt": _iso(item.get("updatedAt") or item.get("createdAt")),
            "platform": event_platform,
            "campaignId": calendar_id or None,
            "campaignName": _campaign_name(calendars_by_id.get(calendar_id, {})) if calendar_id else None,
            "status": None,
        })

    if normalized_campaign == "all" and normalized_platform == "all":
        for item in campaigns:
            activities.append({
                "id": f"campaign-{item['_id']}",
                "activityType": "campaign_updated",
                "title": ACTIVITY_LABELS["campaign_updated"],
                "description": str(item.get("name") or "Campaign"),
                "createdAt": _iso(item.get("updatedAt") or item.get("createdAt")),
                "platform": None,
                "campaignId": str(item["_id"]),
                "campaignName": str(item.get("name") or "Campaign"),
                "status": str(item.get("status") or "").lower() or None,
            })
        for platform_name in ("facebook", "instagram", "twitter", "linkedin"):
            if (
                user.get(f"{platform_name}ConnectionStatus") == "connected"
                and _in_range(user.get("updatedAt"), start, end)
            ):
                activities.append({
                    "id": f"social-{platform_name}",
                    "activityType": "social_connected",
                    "title": ACTIVITY_LABELS["social_connected"],
                    "description": platform_name.title(),
                    "createdAt": _iso(user.get("updatedAt")),
                    "platform": platform_name,
                    "campaignId": None,
                    "campaignName": None,
                    "status": "connected",
                })

    if normalized_activity != "all":
        activities = [item for item in activities if item["activityType"] == normalized_activity]
    activities = [item for item in activities if item.get("createdAt")]
    activities.sort(key=lambda item: item.get("createdAt") or "", reverse=True)
    recent_actions = activities[:8]
    activity_page_items, activity_pagination = _paginate(activities, activity_page, activity_page_size)

    filtered_owned_calendars = [
        item
        for item in owned_calendars
        if (normalized_campaign == "all" or str(item["_id"]) == normalized_campaign)
        and _in_range(item.get("createdAt"), start, end)
    ]
    artwork_count = sum(1 for event in events if event.get("artwork"))
    reel_count = sum(1 for event in events if event.get("reelUrl"))
    media_image_count = sum(1 for item in media if "video" not in str(item.get("type") or "").lower())
    media_video_count = len(media) - media_image_count
    social_activity = sum(
        1
        for item in activities
        if item.get("platform") or item.get("activityType") in {"post_scheduled", "post_published", "post_failed", "social_connected"}
    )

    daily: dict[str, dict[str, Any]] = defaultdict(lambda: {"posts": 0, "images": 0, "reels": 0, "calendars": 0})
    for calendar in filtered_owned_calendars:
        if calendar.get("createdAt"):
            daily[calendar["createdAt"].date().isoformat()]["calendars"] += 1
    for event in events:
        if not event.get("createdAt"):
            continue
        bucket = daily[event["createdAt"].date().isoformat()]
        bucket["posts"] += 1
        bucket["images"] += int(bool(event.get("artwork")))
        bucket["reels"] += int(bool(event.get("reelUrl")))
    content_timeline = [{"date": key, **daily[key]} for key in sorted(daily)]

    last_active_candidates = [
        user.get("lastLoginAt"),
        user.get("antLastSsoAt"),
        user.get("updatedAt"),
        *[item.get("updatedAt") or item.get("createdAt") for item in owned_calendars],
        *[item.get("updatedAt") or item.get("createdAt") for item in events],
    ]
    last_active = max(last_active_candidates, key=_timestamp) if last_active_candidates else None
    campaign_options = [
        {"id": str(item["_id"]), "name": _campaign_name(item)}
        for item in sorted(related_calendars, key=lambda value: _timestamp(value.get("createdAt")), reverse=True)
    ]
    available_platforms = sorted({platform for event in events for platform in _platforms(event)} | {str(item.get("platform")) for item in activities if item.get("platform")})
    available_activity_types = sorted({item["activityType"] for item in activities})

    return {
        "user": {
            "id": user_id,
            "fullname": str(user.get("fullname") or user.get("name") or ""),
            "email": str(user.get("email") or ""),
            "lastActiveAt": _iso(last_active),
        },
        "metrics": {
            "posts": len(events),
            "images": artwork_count + media_image_count,
            "reels": reel_count + media_video_count,
            "calendars": len(filtered_owned_calendars),
            "aiGenerationsEdits": artwork_count + reel_count + len(filtered_versions),
            "socialActivity": social_activity,
        },
        "contentTimeline": content_timeline,
        "recentActions": recent_actions,
        "gallery": gallery_page_items,
        "galleryCounts": gallery_counts,
        "galleryPagination": gallery_pagination,
        "activity": activity_page_items,
        "activityPagination": activity_pagination,
        "filterOptions": {
            "contentTypes": list(CONTENT_TYPES),
            "activityTypes": available_activity_types or sorted(ACTIVITY_LABELS),
            "platforms": available_platforms,
            "campaigns": campaign_options,
        },
    }
