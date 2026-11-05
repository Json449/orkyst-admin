from __future__ import annotations

import os
import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from pipeline.admin_stats import _mongo_client, _orkyst_mongo_uri


def _db():
    uri = _orkyst_mongo_uri()
    if not uri:
        raise RuntimeError("MongoDB is not configured")
    return _mongo_client(uri)[os.getenv("ORKYST_MONGO_DB", "test")]


def _object_id(value: str, label: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError) as exc:
        raise ValueError(f"Invalid {label} ID") from exc


def _slug(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or "command-center"


def _serialize_organization(organization: dict[str, Any], franchise_count: int = 0) -> dict[str, Any]:
    return {
        "id": str(organization["_id"]),
        "name": str(organization.get("name") or ""),
        "slug": str(organization.get("slug") or ""),
        "active": organization.get("active") is not False,
        "franchiseCount": franchise_count,
    }


def _owner_organizations(db, user: dict[str, Any]) -> list[dict[str, Any]]:
    memberships = list(
        db["memberships"].find(
            {
                "role": "org_owner",
                "status": "accepted",
                "$or": [{"userId": user["_id"]}, {"email": str(user.get("email") or "").lower()}],
            },
            {"organizationId": 1},
        )
    )
    organization_ids = [membership["organizationId"] for membership in memberships if membership.get("organizationId")]
    if not organization_ids:
        return []
    organizations = list(db["organizations"].find({"_id": {"$in": organization_ids}}))
    counts = {
        str(item["_id"]): count
        for item in db["accounts"].aggregate(
            [
                {"$match": {"organizationId": {"$in": organization_ids}}},
                {"$group": {"_id": "$organizationId", "count": {"$sum": 1}}},
            ]
        )
        for count in [int(item["count"])]
    }
    return [_serialize_organization(item, counts.get(str(item["_id"]), 0)) for item in organizations]


def list_command_center_users(query: str = "") -> list[dict[str, Any]]:
    db = _db()
    filters: dict[str, Any] = {"orkystRole": {"$ne": "admin"}}
    needle = query.strip()
    if needle:
        pattern = re.compile(re.escape(needle), re.IGNORECASE)
        filters["$or"] = [{"fullname": pattern}, {"email": pattern}, {"company": pattern}]

    users = list(
        db["users"].find(filters, {"email": 1, "fullname": 1, "company": 1, "avatar": 1, "createdAt": 1}).sort("createdAt", -1)
    )
    result = []
    for user in users:
        organizations = _owner_organizations(db, user)
        result.append(
            {
                "id": str(user["_id"]),
                "email": str(user.get("email") or ""),
                "fullname": str(user.get("fullname") or ""),
                "company": str(user.get("company") or ""),
                "avatar": user.get("avatar"),
                "createdAt": user.get("createdAt"),
                "commandCenters": organizations,
            }
        )
    return result


def create_command_center(user_id: str, business_name: str, slug: str | None = None) -> dict[str, Any]:
    db = _db()
    user = db["users"].find_one({"_id": _object_id(user_id, "user")})
    if not user:
        raise LookupError("User not found")
    if _owner_organizations(db, user):
        raise ValueError("This user already owns a Command Center")

    name = business_name.strip()
    if not name:
        raise ValueError("Business name is required")
    candidate = _slug(slug or name)
    unique_slug = candidate
    suffix = 2
    while db["organizations"].find_one({"slug": unique_slug}, {"_id": 1}):
        unique_slug = f"{candidate}-{suffix}"
        suffix += 1

    now = datetime.now(timezone.utc)
    organization = {
        "name": name,
        "slug": unique_slug,
        "ownerUserId": user["_id"],
        "active": True,
        "createdAt": now,
        "updatedAt": now,
    }
    organization_id = db["organizations"].insert_one(organization).inserted_id
    db["memberships"].insert_one(
        {
            "userId": user["_id"],
            "email": str(user.get("email") or "").lower(),
            "name": str(user.get("fullname") or user.get("email") or ""),
            "organizationId": organization_id,
            "accountId": None,
            "role": "org_owner",
            "status": "accepted",
            "inviteToken": None,
            "inviteExpiresAt": None,
            "invitedBy": None,
            "respondedAt": now,
            "createdAt": now,
            "updatedAt": now,
        }
    )
    organization["_id"] = organization_id
    return _serialize_organization(organization)


def list_command_center_franchises(user_id: str) -> list[dict[str, Any]]:
    db = _db()
    user = db["users"].find_one({"_id": _object_id(user_id, "user")}, {"email": 1, "fullname": 1})
    if not user:
        raise LookupError("User not found")
    organizations = _owner_organizations(db, user)
    output = []
    for organization in organizations:
        organization_id = _object_id(organization["id"], "organization")
        franchises = list(
            db["accounts"].find(
                {"organizationId": organization_id},
                {"name": 1, "region": 1, "country": 1, "businessCategory": 1, "ownerName": 1, "ownerEmail": 1, "status": 1, "createdAt": 1},
            ).sort("createdAt", -1)
        )
        output.append(
            {
                **organization,
                "franchises": [
                    {
                        "id": str(franchise["_id"]),
                        "name": str(franchise.get("name") or ""),
                        "region": str(franchise.get("region") or ""),
                        "country": str(franchise.get("country") or ""),
                        "businessCategory": str(franchise.get("businessCategory") or ""),
                        "ownerName": str(franchise.get("ownerName") or ""),
                        "ownerEmail": str(franchise.get("ownerEmail") or ""),
                        "status": str(franchise.get("status") or "setup_pending"),
                    }
                    for franchise in franchises
                ],
            }
        )
    return output


def set_command_center_active(user_id: str, organization_id: str, active: bool) -> dict[str, Any]:
    db = _db()
    user_object_id = _object_id(user_id, "user")
    organization_object_id = _object_id(organization_id, "organization")
    membership = db["memberships"].find_one(
        {"userId": user_object_id, "organizationId": organization_object_id, "role": "org_owner", "status": "accepted"}
    )
    if not membership:
        raise LookupError("Command Center not found for this user")
    organization = db["organizations"].find_one_and_update(
        {"_id": organization_object_id},
        {"$set": {"active": active, "updatedAt": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not organization:
        raise LookupError("Command Center not found")
    return _serialize_organization(organization)


def delete_command_center(user_id: str, organization_id: str) -> None:
    db = _db()
    user_object_id = _object_id(user_id, "user")
    organization_object_id = _object_id(organization_id, "organization")
    membership = db["memberships"].find_one(
        {"userId": user_object_id, "organizationId": organization_object_id, "role": "org_owner", "status": "accepted"}
    )
    if not membership:
        raise LookupError("Command Center not found for this user")

    calendar_ids = [item["_id"] for item in db["calendars"].find({"organizationId": organization_object_id}, {"_id": 1})]
    db["events"].delete_many({"$or": [{"organizationId": organization_object_id}, {"calendarId": {"$in": calendar_ids}}]})
    for collection in ("calendars", "memberships", "accounts", "brandkits", "enterprisecampaigns", "campaignassignments", "campaignposts", "enterprisemedia", "enterpriseproducts", "aisettings"):
        db[collection].delete_many({"organizationId": organization_object_id})
    db["organizations"].delete_one({"_id": organization_object_id})
