from __future__ import annotations

import math
import os
import re
import time
from collections import defaultdict
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from pipeline.admin_stats import _mongo_client, _orkyst_mongo_uri


STATUSES = ("Active", "Onboarding", "Pending", "Suspended")
MILESTONES = (
    "Account created",
    "Owner assigned",
    "Team member accepted",
    "Command center created",
    "Command center activated",
    "First calendar created",
)
SOCIALS = (
    ("Instagram", "instagramConnectionStatus", "#2563EB"),
    ("Facebook", "facebookConnectionStatus", "#F97316"),
    ("Twitter", "twitterConnectionStatus", "#111827"),
    ("LinkedIn", "linkedinConnectionStatus", "#0A66C2"),
)


def _iso(value: Any) -> str | None:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return str(value) if value else None


def _short_date(value: Any) -> str | None:
    if not isinstance(value, datetime):
        return None
    return f"{value:%b} {value.day}"


def _long_date(value: Any) -> str:
    if not isinstance(value, datetime):
        return "—"
    return f"{value:%b} {value.day}, {value.year}"


def _timestamp(value: Any) -> float:
    if not isinstance(value, datetime):
        return float("-inf")
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.timestamp()


def _plan(value: Any) -> str:
    normalized = str(value or "basic").strip().lower()
    if normalized == "enterprise":
        return "Enterprise"
    if normalized == "pro":
        return "Pro"
    return "Basic"


def _first(values: list[Any], fallback: str) -> str:
    return next((str(value).strip() for value in values if str(value or "").strip()), fallback)


@lru_cache(maxsize=2)
def _organization_snapshot(cache_window: int) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    del cache_window
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("MongoDB is not configured")

    db = _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]
    organizations = list(
        db["organizations"].find(
            {}, {"name": 1, "slug": 1, "ownerUserId": 1, "createdAt": 1, "updatedAt": 1}
        )
    )
    if not organizations:
        return [], {}

    organization_ids = [item["_id"] for item in organizations]
    memberships = list(
        db["memberships"].find(
            {"organizationId": {"$in": organization_ids}},
            {"organizationId": 1, "userId": 1, "name": 1, "email": 1, "role": 1, "status": 1, "createdAt": 1, "respondedAt": 1},
        )
    )
    accounts = list(
        db["accounts"].find(
            {"organizationId": {"$in": organization_ids}},
            {
                "organizationId": 1,
                "name": 1,
                "ownerName": 1,
                "ownerEmail": 1,
                "ownerUserId": 1,
                "country": 1,
                "businessCategory": 1,
                "branchDescription": 1,
                "status": 1,
                "createdAt": 1,
            },
        )
    )

    user_ids = {item.get("ownerUserId") for item in organizations if item.get("ownerUserId")}
    user_ids.update(item.get("userId") for item in memberships if item.get("userId"))
    user_ids.update(item.get("ownerUserId") for item in accounts if item.get("ownerUserId"))
    users = list(
        db["users"].find(
            {"_id": {"$in": list(user_ids)}},
            {
                "fullname": 1,
                "email": 1,
                "plan": 1,
                "isOnboardingCompleted": 1,
                "socialPostsGeneratedThisMonth": 1,
                "imagesGeneratedThisMonth": 1,
                "reelUsageThisMonth": 1,
                "calendarsGeneratedThisMonth": 1,
                "facebookConnectionStatus": 1,
                "instagramConnectionStatus": 1,
                "twitterConnectionStatus": 1,
                "linkedinConnectionStatus": 1,
            },
        )
    )
    users_by_id = {str(item["_id"]): item for item in users}

    memberships_by_org: dict[str, list[dict[str, Any]]] = defaultdict(list)
    organizations_by_user: dict[str, str] = {}
    for membership in memberships:
        org_id = str(membership["organizationId"])
        memberships_by_org[org_id].append(membership)
        if membership.get("userId") and membership.get("status") == "accepted":
            organizations_by_user.setdefault(str(membership["userId"]), org_id)
    for organization in organizations:
        if organization.get("ownerUserId"):
            organizations_by_user.setdefault(str(organization["ownerUserId"]), str(organization["_id"]))

    accounts_by_org: dict[str, list[dict[str, Any]]] = defaultdict(list)
    organization_by_account: dict[str, str] = {}
    for account in accounts:
        org_id = str(account["organizationId"])
        accounts_by_org[org_id].append(account)
        organization_by_account[str(account["_id"])] = org_id

    calendars = list(
        db["calendars"].find(
            {
                "$or": [
                    {"organizationId": {"$in": organization_ids}},
                    {"accountId": {"$in": [item["_id"] for item in accounts]}},
                    {"userId": {"$in": list(user_ids)}},
                ]
            },
            {"organizationId": 1, "accountId": 1, "userId": 1, "calendarInputs": 1, "theme": 1, "createdAt": 1},
        )
    )
    calendars_by_org: dict[str, list[dict[str, Any]]] = defaultdict(list)
    organization_by_calendar: dict[str, str] = {}
    for calendar in calendars:
        org_id = (
            str(calendar.get("organizationId")) if calendar.get("organizationId") else None
        ) or organization_by_account.get(str(calendar.get("accountId"))) or organizations_by_user.get(str(calendar.get("userId")))
        if org_id:
            calendars_by_org[org_id].append(calendar)
            organization_by_calendar[str(calendar["_id"])] = org_id

    events_by_org: dict[str, list[dict[str, Any]]] = defaultdict(list)
    if organization_by_calendar:
        from bson import ObjectId

        calendar_object_ids = [ObjectId(value) for value in organization_by_calendar]
        for event in db["events"].find(
            {"calendarId": {"$in": calendar_object_ids}},
            {"calendarId": 1, "title": 1, "artwork": 1, "reelUrl": 1, "postingStatus": 1, "createdAt": 1},
        ):
            org_id = organization_by_calendar.get(str(event.get("calendarId")))
            if org_id:
                events_by_org[org_id].append(event)

    rows: list[dict[str, Any]] = []
    details: dict[str, dict[str, Any]] = {}
    for organization in organizations:
        org_id = str(organization["_id"])
        slug = str(organization.get("slug") or org_id)
        org_memberships = memberships_by_org[org_id]
        accepted = [item for item in org_memberships if item.get("status") == "accepted"]
        org_accounts = accounts_by_org[org_id]
        org_calendars = calendars_by_org[org_id]
        org_events = events_by_org[org_id]
        owner_membership = next(
            (
                item
                for item in org_memberships
                if item.get("role") == "org_owner"
            ),
            {},
        )
        account_owner_user_id = next(
            (item.get("ownerUserId") for item in org_accounts if item.get("ownerUserId")),
            None,
        )
        owner_user_id = (
            organization.get("ownerUserId")
            or owner_membership.get("userId")
            or account_owner_user_id
        )
        owner = users_by_id.get(str(owner_user_id), {})
        member_ids = {str(item["userId"]) for item in accepted if item.get("userId")}
        if owner_user_id:
            member_ids.add(str(owner_user_id))
        org_users = [users_by_id[user_id] for user_id in member_ids if user_id in users_by_id]

        owner_name = str(owner.get("fullname") or "") or _first(
            [owner_membership.get("name"), *[item.get("ownerName") for item in org_accounts]],
            "Unassigned",
        )
        owner_email = _first(
            [
                owner.get("email"),
                owner_membership.get("email"),
                *[item.get("ownerEmail") for item in org_accounts],
            ],
            "",
        )
        active_accounts = [item for item in org_accounts if item.get("status") == "active"]
        all_suspended = bool(org_accounts) and all(item.get("status") == "suspended" for item in org_accounts)
        milestone_values = [
            bool(organization.get("createdAt")),
            bool(organization.get("ownerUserId")),
            bool(accepted),
            bool(org_accounts),
            bool(active_accounts),
            bool(org_calendars),
        ]
        completed = sum(milestone_values)
        onboarding = round(completed / len(MILESTONES) * 100)
        status = (
            "Suspended"
            if all_suspended
            else "Pending"
            if not accepted
            else "Onboarding"
            if onboarding < 100
            else "Active"
        )
        country = _first([item.get("country") for item in org_accounts], "Not specified")
        industry = _first([item.get("businessCategory") for item in org_accounts], "Not specified")
        plan = _plan(owner.get("plan"))
        posts = sum(int(item.get("socialPostsGeneratedThisMonth", 0) or 0) for item in org_users)
        images = sum(int(item.get("imagesGeneratedThisMonth", 0) or 0) for item in org_users)
        reels = sum(int(item.get("reelUsageThisMonth", 0) or 0) for item in org_users)
        website = _first(
            [(item.get("calendarInputs") or {}).get("companyWebsite") for item in org_calendars],
            "",
        )
        row = {
            "id": org_id,
            "slug": slug,
            "name": str(organization.get("name") or "Unnamed organization"),
            "sector": f"{industry} · {country}",
            "industry": industry,
            "country": country,
            "emoji": "🏢",
            "plan": plan,
            "owner": owner_name,
            "ownerEmail": owner_email or None,
            "users": len(member_ids),
            "status": status,
            "onboarding": onboarding,
            "posts": posts,
            "images": images,
            "joined": _iso(organization.get("createdAt")) or "",
            "franchises": len(org_accounts) if len(org_accounts) > 1 else None,
            "website": website or None,
        }
        rows.append(row)

        completed_steps = []
        step_dates = [
            organization.get("createdAt"),
            organization.get("updatedAt") if organization.get("ownerUserId") else None,
            min((item.get("respondedAt") or item.get("createdAt") for item in accepted), default=None),
            min((item.get("createdAt") for item in org_accounts), default=None),
            min((item.get("createdAt") for item in active_accounts), default=None),
            min((item.get("createdAt") for item in org_calendars), default=None),
        ]
        for label, done, date in zip(MILESTONES, milestone_values, step_dates):
            if done:
                completed_steps.append({"label": label, "date": _short_date(date)})

        recent_activity = []
        for calendar in org_calendars:
            recent_activity.append(
                {
                    "title": "Calendar created",
                    "meta": str(calendar.get("theme") or "Content calendar"),
                    "time": _short_date(calendar.get("createdAt")) or "—",
                    "tone": "brand",
                    "createdAt": calendar.get("createdAt"),
                }
            )
        for event in org_events:
            recent_activity.append(
                {
                    "title": "Content event created",
                    "meta": str(event.get("postingStatus") or "draft").replace("_", " ").title(),
                    "time": _short_date(event.get("createdAt")) or "—",
                    "tone": "info",
                    "createdAt": event.get("createdAt"),
                }
            )
        recent_activity.sort(
            key=lambda item: _timestamp(item.get("createdAt")),
            reverse=True,
        )
        for item in recent_activity:
            item.pop("createdAt", None)

        description = _first([item.get("branchDescription") for item in org_accounts], "")
        details[slug] = {
            "organization": {
                **row,
                "ownerEmail": owner_email or None,
            },
            "detail": {
                "description": description or None,
                "joinedFull": _long_date(organization.get("createdAt")),
                "usage": {
                    "posts": posts,
                    "images": images,
                    "reels": reels,
                    "calendars": len(org_calendars),
                },
                "onboardingSteps": completed_steps,
                "socials": [
                    {
                        "name": name,
                        "color": color,
                        "connected": any(user.get(field) == "connected" for user in org_users),
                    }
                    for name, field, color in SOCIALS
                ],
                "activity": recent_activity[:12],
            },
        }

    rows.sort(key=lambda item: item.get("joined") or "", reverse=True)
    return rows, details


def _snapshot() -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    ttl = max(5, int(os.getenv("ADMIN_ORGANIZATIONS_CACHE_TTL_SECONDS", "30")))
    return _organization_snapshot(int(time.monotonic() // ttl))


def list_admin_organizations(
    *, query: str = "", status: str = "all", plan: str = "all", page: int = 1, page_size: int = 10
) -> dict[str, Any]:
    rows, _ = _snapshot()
    needle = query.strip().lower()
    normalized_status = status.strip().lower()
    normalized_plan = plan.strip().lower()
    filtered = [
        row
        for row in rows
        if (
            not needle
            or needle
            in " ".join(
                (row["name"], row["industry"], row["country"], row.get("ownerEmail") or "")
            ).lower()
        )
        and (normalized_status == "all" or row["status"].lower() == normalized_status)
        and (normalized_plan == "all" or row["plan"].lower() == normalized_plan)
    ]
    page_size = min(100, max(1, page_size))
    total = len(filtered)
    pages = max(1, math.ceil(total / page_size))
    page = min(max(1, page), pages)
    start = (page - 1) * page_size
    counts = {"all": len(rows), **{status.lower(): 0 for status in STATUSES}}
    for row in rows:
        counts[row["status"].lower()] += 1
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
        "statusCounts": counts,
    }


def get_admin_organization(slug: str) -> dict[str, Any] | None:
    _, details = _snapshot()
    return details.get(slug)
