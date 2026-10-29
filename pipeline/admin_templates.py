from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import time
import logging
from datetime import datetime, timezone
from functools import lru_cache
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from uuid import uuid4

from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError


logger = logging.getLogger(__name__)

DEFAULT_TAXONOMY = (
    ("Food & Beverage", ("Pizza", "Burgers", "Fried Chicken", "Desserts", "Drinks", "Combo Deals", "Product Spotlight", "Limited-Time Offers", "Family Meals")),
    ("Retail & Commerce", ("Grocery Stores", "Convenience Stores", "Product Promotions", "Retail Partnerships", "Wholesale & Distribution", "Store Growth", "Benefits & Features", "Customer Engagement")),
    ("Beauty & Personal Care", ("Skincare", "Haircare", "Cosmetics", "Salon & Spa", "Product Spotlight", "Offers")),
    ("Fashion & Apparel", ("New Arrivals", "Seasonal Collections", "Accessories", "Footwear", "Promotions", "Lifestyle")),
    ("Technology", ("Software", "Mobile Apps", "Electronics", "Product Launches", "Features & Benefits", "Offers")),
    ("Health & Wellness", ("Fitness", "Nutrition", "Healthcare", "Self Care", "Programs", "Announcements")),
    ("Services", ("Professional Services", "Home Services", "Hospitality", "Education", "Bookings", "Customer Stories")),
    ("Announcements", ("Product Launch", "Company News", "Events", "Opening Soon", "Milestones")),
    ("Minimal", ("Clean Product", "Premium", "Editorial", "Simple Offer", "Brand Story")),
    ("Sales & Promotions", ("Discounts", "Limited-Time Offers", "Seasonal Offers", "Bundles", "Call to Action")),
    ("Product Showcase", ("Product Spotlight", "Features", "Benefits", "Close-ups", "Lifestyle")),
    ("Benefits", ("Features & Benefits", "How It Works", "Trust & Proof", "Comparison")),
    ("Lifestyle", ("Everyday Moments", "Family", "Community", "Behind the Scenes")),
)
TAXONOMY_VERSION = 2
RESERVED_CATEGORY_NAMES = {"all templates", "create your own", "let ai decide"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_BATCH_TEMPLATES = 20
MAX_BATCH_BYTES = 50 * 1024 * 1024
DATA_URL_PATTERN = re.compile(r"^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$")


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is not configured")
    return value


def _mongo_uri() -> str:
    template_uri = os.getenv("ORKYST_TEMPLATE_MONGO_URI", "").strip()
    if template_uri:
        return template_uri
    return _required_env("ORKYST_MONGO_URI") if os.getenv("ORKYST_MONGO_URI") else _required_env("MONGODB_CONNECTION_URL")


@lru_cache(maxsize=1)
def _mongo_client() -> MongoClient:
    return MongoClient(_mongo_uri(), serverSelectionTimeoutMS=10_000, connectTimeoutMS=10_000)


def _template_collection():
    database_name = os.getenv("ORKYST_MONGO_DB", "test").strip() or "test"
    return _mongo_client()[database_name]["ad_templates"]


def _category_collection():
    database_name = os.getenv("ORKYST_MONGO_DB", "test").strip() or "test"
    return _mongo_client()[database_name]["ad_template_categories"]


def _taxonomy_meta_collection():
    database_name = os.getenv("ORKYST_MONGO_DB", "test").strip() or "test"
    return _mongo_client()[database_name]["ad_template_taxonomy_meta"]


@lru_cache(maxsize=1)
def _legacy_mongo_client() -> MongoClient | None:
    legacy_uri = os.getenv("ORKYST_TEMPLATE_LEGACY_MONGO_URI", "").strip()
    if not legacy_uri or legacy_uri == _mongo_uri():
        return None
    return MongoClient(legacy_uri, serverSelectionTimeoutMS=10_000, connectTimeoutMS=10_000)


def _legacy_template_collection():
    client = _legacy_mongo_client()
    if client is None:
        return None
    database_name = os.getenv("ORKYST_MONGO_DB", "test").strip() or "test"
    return client[database_name]["ad_templates"]


def _sync_legacy_templates() -> None:
    """Copy existing Admin uploads into the main app database once, by ID."""
    legacy_collection = _legacy_template_collection()
    if legacy_collection is None:
        return
    try:
        documents = legacy_collection.find({})
        for document in documents:
            template_id = str(document.get("id", "")).strip()
            if template_id:
                _template_collection().update_one(
                    {"id": template_id},
                    {"$setOnInsert": document},
                    upsert=True,
                )
    except Exception:
        # New template uploads and reads must continue even when an old,
        # no-longer-reachable database cannot be contacted.
        return


def _serialize_template(document: dict) -> dict:
    created_at = document.get("createdAt")
    if isinstance(created_at, datetime):
        created_at = created_at.astimezone(timezone.utc).isoformat()
    return {
        "id": str(document.get("id", "")),
        "name": str(document.get("name", "Untitled template")),
        "category": str(document.get("category", "")),
        "description": str(document.get("description", "")),
        "taxonomyAssignments": [
            {
                "categoryId": str(assignment.get("categoryId", "")),
                "subcategoryIds": [str(value) for value in assignment.get("subcategoryIds", []) if value],
            }
            for assignment in document.get("taxonomyAssignments", [])
            if assignment.get("categoryId")
        ],
        "imageUrl": str(document.get("imageUrl", "")),
        "createdAt": created_at or "",
    }


def _normalize_category_name(name: str) -> str:
    normalized = re.sub(r"\s+", " ", str(name or "")).strip()
    if not normalized:
        raise ValueError("Category name is required")
    if len(normalized) > 60:
        raise ValueError("Category name must be 60 characters or fewer")
    if normalized.casefold() in RESERVED_CATEGORY_NAMES:
        raise ValueError("That category name is reserved")
    return normalized


def _normalize_subcategory_name(name: str) -> str:
    normalized = re.sub(r"\s+", " ", str(name or "")).strip()
    if not normalized:
        raise ValueError("Subcategory name is required")
    if len(normalized) > 60:
        raise ValueError("Subcategory name must be 60 characters or fewer")
    if normalized.casefold().startswith("all "):
        raise ValueError("'All' subcategories are generated automatically")
    return normalized


def _default_id(prefix: str, *parts: str) -> str:
    digest = hashlib.sha1("::".join(parts).casefold().encode("utf-8")).hexdigest()[:16]
    return f"{prefix}-{digest}"


def _ensure_template_categories() -> None:
    collection = _category_collection()
    collection.create_index("normalizedName", unique=True)
    meta = _taxonomy_meta_collection().find_one({"key": "template-taxonomy"}) or {}
    if int(meta.get("version", 0)) < TAXONOMY_VERSION:
        now = datetime.now(timezone.utc)
        for order, (name, subcategory_names) in enumerate(DEFAULT_TAXONOMY):
            normalized_name = _normalize_category_name(name)
            document = collection.find_one({"normalizedName": normalized_name.casefold()})
            category_id = str(document.get("id")) if document and document.get("id") else _default_id("cat", normalized_name)
            existing_subcategories = list(document.get("subcategories", [])) if document else []
            existing_names = {str(item.get("name", "")).casefold() for item in existing_subcategories}
            for sub_order, subcategory_name in enumerate(subcategory_names):
                if subcategory_name.casefold() in existing_names:
                    continue
                existing_subcategories.append({
                    "id": _default_id("sub", category_id, subcategory_name),
                    "name": subcategory_name,
                    "normalizedName": subcategory_name.casefold(),
                    "imageUrl": "",
                    "sortOrder": sub_order,
                    "createdAt": now,
                })
            collection.update_one(
                {"normalizedName": normalized_name.casefold()},
                {
                    "$setOnInsert": {
                        "id": category_id,
                        "name": normalized_name,
                        "normalizedName": normalized_name.casefold(),
                        "createdAt": now,
                    },
                    "$set": {
                        "subcategories": existing_subcategories,
                        "sortOrder": document.get("sortOrder", order) if document else order,
                    },
                },
                upsert=True,
            )
        _taxonomy_meta_collection().update_one(
            {"key": "template-taxonomy"},
            {"$set": {"version": TAXONOMY_VERSION, "updatedAt": now}},
            upsert=True,
        )

    names: set[str] = set()
    names.update(
        str(name).strip()
        for name in _template_collection().distinct("category")
        if str(name).strip()
    )
    now = datetime.now(timezone.utc)
    for name in names:
        try:
            normalized_name = _normalize_category_name(name)
        except ValueError:
            continue
        collection.update_one(
            {"normalizedName": normalized_name.casefold()},
            {
                "$setOnInsert": {
                    "id": uuid4().hex,
                    "name": normalized_name,
                    "normalizedName": normalized_name.casefold(),
                    "createdAt": now,
                }
            },
            upsert=True,
        )


def _serialize_category(document: dict) -> dict:
    created_at = document.get("createdAt")
    if isinstance(created_at, datetime):
        created_at = created_at.astimezone(timezone.utc).isoformat()
    name = str(document.get("name", ""))
    category_id = str(document.get("id", ""))
    template_filter = {
        "$or": [
            {"taxonomyAssignments.categoryId": category_id},
            {"category": name},
        ]
    }
    subcategories = []
    for item in sorted(document.get("subcategories", []), key=lambda value: (int(value.get("sortOrder", 0)), str(value.get("name", "")))):
        subcategory_id = str(item.get("id", ""))
        sub_created_at = item.get("createdAt")
        if isinstance(sub_created_at, datetime):
            sub_created_at = sub_created_at.astimezone(timezone.utc).isoformat()
        subcategories.append({
            "id": subcategory_id,
            "name": str(item.get("name", "")),
            "imageUrl": str(item.get("imageUrl", "")),
            "templateCount": _template_collection().count_documents({
                "taxonomyAssignments": {
                    "$elemMatch": {
                        "categoryId": category_id,
                        "subcategoryIds": subcategory_id,
                    }
                }
            }),
            "createdAt": sub_created_at or "",
        })
    return {
        "id": category_id,
        "name": name,
        "templateCount": _template_collection().count_documents(template_filter),
        "subcategories": subcategories,
        "sortOrder": int(document.get("sortOrder", 0)),
        "createdAt": created_at or "",
    }


def list_template_categories() -> dict:
    _sync_legacy_templates()
    _ensure_template_categories()
    documents = _category_collection().find({}).sort([("sortOrder", 1), ("name", 1)])
    return {"items": [_serialize_category(document) for document in documents]}


def _resolve_category_name(name: str) -> str:
    _ensure_template_categories()
    normalized = _normalize_category_name(name)
    document = _category_collection().find_one(
        {"normalizedName": normalized.casefold()}
    )
    if not document:
        raise ValueError("Choose a valid template category")
    return str(document.get("name", normalized))


def create_template_category(*, name: str, created_by: str | None = None) -> dict:
    _ensure_template_categories()
    normalized = _normalize_category_name(name)
    document = {
        "id": uuid4().hex,
        "name": normalized,
        "normalizedName": normalized.casefold(),
        "subcategories": [],
        "sortOrder": _category_collection().count_documents({}),
        "createdAt": datetime.now(timezone.utc),
        "createdBy": created_by or "",
    }
    try:
        _category_collection().insert_one(document)
    except DuplicateKeyError as exc:
        raise ValueError("A template category with this name already exists") from exc
    return _serialize_category(document)


def update_template_category(*, category_id: str, name: str) -> dict | None:
    _ensure_template_categories()
    document = _category_collection().find_one({"id": category_id})
    if not document:
        return None
    normalized = _normalize_category_name(name)
    old_name = str(document.get("name", ""))
    if normalized.casefold() != str(document.get("normalizedName", "")):
        duplicate = _category_collection().find_one(
            {"normalizedName": normalized.casefold(), "id": {"$ne": category_id}}
        )
        if duplicate:
            raise ValueError("A template category with this name already exists")
    _template_collection().update_many(
        {"category": old_name}, {"$set": {"category": normalized}}
    )
    try:
        _category_collection().update_one(
            {"id": category_id},
            {"$set": {"name": normalized, "normalizedName": normalized.casefold()}},
        )
    except Exception:
        _template_collection().update_many(
            {"category": normalized}, {"$set": {"category": old_name}}
        )
        raise
    return _serialize_category({**document, "name": normalized, "normalizedName": normalized.casefold()})


def create_template_subcategory(
    *, category_id: str, name: str, image_data: str | None = None
) -> dict | None:
    _ensure_template_categories()
    category = _category_collection().find_one({"id": category_id})
    if not category:
        return None
    normalized = _normalize_subcategory_name(name)
    if any(str(item.get("name", "")).casefold() == normalized.casefold() for item in category.get("subcategories", [])):
        raise ValueError("A subcategory with this name already exists")
    subcategory_id = uuid4().hex
    image_url = ""
    public_id = ""
    if image_data and image_data.strip():
        _validate_template_image(image_data)
        image_url, public_id = _upload_to_cloudinary(
            image_data=image_data, template_id=f"subcategory-{subcategory_id}"
        )
    subcategory = {
        "id": subcategory_id,
        "name": normalized,
        "normalizedName": normalized.casefold(),
        "imageUrl": image_url,
        "cloudinaryPublicId": public_id,
        "sortOrder": len(category.get("subcategories", [])),
        "createdAt": datetime.now(timezone.utc),
    }
    _category_collection().update_one(
        {"id": category_id}, {"$push": {"subcategories": subcategory}}
    )
    return next(item for item in _serialize_category({**category, "subcategories": [*category.get("subcategories", []), subcategory]})["subcategories"] if item["id"] == subcategory_id)


def update_template_subcategory(
    *, category_id: str, subcategory_id: str, name: str, image_data: str | None = None
) -> dict | None:
    _ensure_template_categories()
    category = _category_collection().find_one({"id": category_id})
    if not category:
        return None
    subcategories = list(category.get("subcategories", []))
    index = next((i for i, item in enumerate(subcategories) if str(item.get("id")) == subcategory_id), -1)
    if index < 0:
        return None
    normalized = _normalize_subcategory_name(name)
    if any(i != index and str(item.get("name", "")).casefold() == normalized.casefold() for i, item in enumerate(subcategories)):
        raise ValueError("A subcategory with this name already exists")
    previous = subcategories[index]
    updated = {**previous, "name": normalized, "normalizedName": normalized.casefold()}
    if image_data and image_data.strip():
        _validate_template_image(image_data)
        image_url, public_id = _upload_to_cloudinary(
            image_data=image_data, template_id=f"subcategory-{subcategory_id}"
        )
        updated.update({"imageUrl": image_url, "cloudinaryPublicId": public_id})
    subcategories[index] = updated
    _category_collection().update_one(
        {"id": category_id}, {"$set": {"subcategories": subcategories}}
    )
    return next(item for item in _serialize_category({**category, "subcategories": subcategories})["subcategories"] if item["id"] == subcategory_id)


def delete_template_subcategory(*, category_id: str, subcategory_id: str) -> bool:
    _ensure_template_categories()
    category = _category_collection().find_one({"id": category_id})
    if not category:
        return False
    subcategory = next((item for item in category.get("subcategories", []) if str(item.get("id")) == subcategory_id), None)
    if not subcategory:
        return False
    if _template_collection().count_documents({"taxonomyAssignments.subcategoryIds": subcategory_id}):
        raise ValueError("Remove this subcategory from its templates before deleting it")
    result = _category_collection().update_one(
        {"id": category_id}, {"$pull": {"subcategories": {"id": subcategory_id}}}
    )
    public_id = str(subcategory.get("cloudinaryPublicId", ""))
    if result.modified_count and public_id:
        try:
            _delete_from_cloudinary(public_id)
        except Exception:
            logger.exception("Could not remove subcategory image %s", public_id)
    return bool(result.modified_count)


def delete_template_category(category_id: str) -> bool:
    _ensure_template_categories()
    document = _category_collection().find_one({"id": category_id})
    if not document:
        return False
    name = str(document.get("name", ""))
    if _template_collection().count_documents({"$or": [{"category": name}, {"taxonomyAssignments.categoryId": category_id}]}):
        raise ValueError("Move or delete templates in this category before deleting it")
    deleted = bool(_category_collection().delete_one({"id": category_id}).deleted_count)
    if deleted:
        for subcategory in document.get("subcategories", []):
            public_id = str(subcategory.get("cloudinaryPublicId", ""))
            if not public_id:
                continue
            try:
                _delete_from_cloudinary(public_id)
            except Exception:
                logger.exception("Could not remove subcategory image %s", public_id)
    return deleted


def list_admin_templates() -> dict:
    _sync_legacy_templates()
    categories = list_template_categories()["items"]
    documents = _template_collection().find({}).sort("createdAt", -1)
    return {
        "items": [_serialize_template(document) for document in documents],
        "categories": [category["name"] for category in categories],
    }


def _cloudinary_signature(params: dict[str, str], api_secret: str) -> str:
    payload = "&".join(f"{key}={params[key]}" for key in sorted(params))
    return hashlib.sha1(f"{payload}{api_secret}".encode("utf-8")).hexdigest()


def _cloudinary_config() -> tuple[str, str, str]:
    return (
        _required_env("CLOUDINARY_CLOUD_NAME"),
        _required_env("CLOUDINARY_API_KEY"),
        _required_env("CLOUDINARY_API_SECRET"),
    )


def _upload_to_cloudinary(*, image_data: str, template_id: str) -> tuple[str, str]:
    cloud_name, api_key, api_secret = _cloudinary_config()
    folder = os.getenv("CLOUDINARY_TEMPLATE_FOLDER", "admin-templates").strip() or "admin-templates"
    public_id = f"template-{template_id}"
    timestamp = str(int(time.time()))
    signed_params = {"folder": folder, "public_id": public_id, "timestamp": timestamp}
    payload = {
        "file": image_data,
        "api_key": api_key,
        **signed_params,
        "signature": _cloudinary_signature(signed_params, api_secret),
    }
    request = Request(
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload",
        data=urlencode(payload).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"Cloudinary upload failed: {exc}") from exc
    secure_url = result.get("secure_url")
    if not secure_url:
        raise RuntimeError("Cloudinary returned no secure URL")
    return str(secure_url), f"{folder}/{public_id}"


def _delete_from_cloudinary(public_id: str) -> None:
    cloud_name, api_key, api_secret = _cloudinary_config()
    timestamp = str(int(time.time()))
    signed_params = {"public_id": public_id, "timestamp": timestamp}
    payload = {
        **signed_params,
        "api_key": api_key,
        "invalidate": "true",
        "signature": _cloudinary_signature(signed_params, api_secret),
    }
    request = Request(
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy",
        data=urlencode(payload).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"Cloudinary delete failed: {exc}") from exc
    if result.get("result") not in {"ok", "not found"}:
        raise RuntimeError("Cloudinary did not delete the template image")


def _validate_template_image(image_data: str) -> int:
    match = DATA_URL_PATTERN.fullmatch(image_data.strip())
    if not match:
        raise ValueError("Upload a PNG, JPEG, or WebP image")
    try:
        image_bytes = base64.b64decode(
            re.sub(r"\s+", "", match.group(2)), validate=True
        )
    except ValueError as exc:
        raise ValueError("The selected image could not be read") from exc
    if not image_bytes or len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("Images must be smaller than 10 MB each")
    return len(image_bytes)


def _normalize_taxonomy_assignments(
    assignments: list[dict[str, object]] | None,
    legacy_category: str = "",
) -> tuple[list[dict[str, object]], str]:
    _ensure_template_categories()
    categories = list(_category_collection().find({}))
    categories_by_id = {str(document.get("id", "")): document for document in categories}
    requested = assignments or []
    if not requested and legacy_category.strip():
        legacy = next(
            (
                document
                for document in categories
                if str(document.get("name", "")).casefold()
                == legacy_category.strip().casefold()
            ),
            None,
        )
        if legacy:
            requested = [{"categoryId": str(legacy.get("id", "")), "subcategoryIds": []}]
    if not requested:
        raise ValueError("Choose at least one template category")

    normalized: list[dict[str, object]] = []
    seen_categories: set[str] = set()
    for assignment in requested:
        category_id = str(assignment.get("categoryId", "")).strip()
        if not category_id or category_id in seen_categories:
            continue
        category = categories_by_id.get(category_id)
        if not category:
            raise ValueError("Choose valid template categories")
        valid_subcategory_ids = {
            str(item.get("id", "")) for item in category.get("subcategories", [])
        }
        subcategory_ids = []
        for value in assignment.get("subcategoryIds", []) or []:
            subcategory_id = str(value).strip()
            if subcategory_id and subcategory_id not in subcategory_ids:
                if subcategory_id not in valid_subcategory_ids:
                    raise ValueError("Choose subcategories that belong to their selected category")
                subcategory_ids.append(subcategory_id)
        normalized.append(
            {"categoryId": category_id, "subcategoryIds": subcategory_ids}
        )
        seen_categories.add(category_id)
    if not normalized:
        raise ValueError("Choose at least one template category")
    primary_category = str(categories_by_id[str(normalized[0]["categoryId"])].get("name", ""))
    return normalized, primary_category


def create_admin_template(
    *,
    name: str,
    category: str = "",
    image_data: str,
    description: str = "",
    taxonomy_assignments: list[dict[str, object]] | None = None,
    uploaded_by: str | None = None,
) -> dict:
    _sync_legacy_templates()
    normalized_name = name.strip() or "Untitled template"
    normalized_assignments, normalized_category = _normalize_taxonomy_assignments(
        taxonomy_assignments, category
    )

    _validate_template_image(image_data)

    template_id = uuid4().hex
    image_url, public_id = _upload_to_cloudinary(image_data=image_data, template_id=template_id)
    document = {
        "id": template_id,
        "name": normalized_name[:100],
        "category": normalized_category,
        "description": re.sub(r"\s+", " ", description).strip()[:180],
        "taxonomyAssignments": normalized_assignments,
        "imageUrl": image_url,
        "cloudinaryPublicId": public_id,
        "createdAt": datetime.now(timezone.utc),
        "createdBy": uploaded_by or "",
    }
    try:
        _template_collection().insert_one(document)
    except Exception as exc:
        try:
            _delete_from_cloudinary(public_id)
        except Exception:
            pass
        raise RuntimeError(f"Template metadata could not be saved to MongoDB: {exc}") from exc
    return _serialize_template(document)


def create_admin_templates(
    *,
    items: list[dict[str, str]],
    category: str = "",
    taxonomy_assignments: list[dict[str, object]] | None = None,
    uploaded_by: str | None = None,
) -> dict:
    if not items:
        raise ValueError("Choose at least one template image")
    if len(items) > MAX_BATCH_TEMPLATES:
        raise ValueError(f"Upload no more than {MAX_BATCH_TEMPLATES} templates at once")

    normalized_assignments, normalized_category = _normalize_taxonomy_assignments(
        taxonomy_assignments, category
    )
    normalized_items: list[dict[str, str]] = []
    total_bytes = 0
    for index, item in enumerate(items, start=1):
        name = str(item.get("name", "")).strip() or f"Template {index}"
        description = re.sub(r"\s+", " ", str(item.get("description", ""))).strip()[:180]
        image_data = str(item.get("imageData", ""))
        try:
            total_bytes += _validate_template_image(image_data)
        except ValueError as exc:
            raise ValueError(f"Template {index} ({name}): {exc}") from exc
        normalized_items.append({"name": name[:100], "description": description, "imageData": image_data})
    if total_bytes > MAX_BATCH_BYTES:
        raise ValueError("The combined batch must be 50 MB or smaller")

    created: list[dict] = []
    try:
        for item in normalized_items:
            created.append(
                create_admin_template(
                    name=item["name"],
                    category=normalized_category,
                    image_data=item["imageData"],
                    description=item["description"],
                    taxonomy_assignments=normalized_assignments,
                    uploaded_by=uploaded_by,
                )
            )
    except Exception:
        for template in created:
            try:
                delete_admin_template(str(template.get("id", "")))
            except Exception:
                logger.exception(
                    "Could not roll back template %s after a batch upload failure",
                    template.get("id", ""),
                )
        raise
    return {"items": created}


def update_admin_template(
    *,
    template_id: str,
    name: str,
    category: str = "",
    description: str = "",
    taxonomy_assignments: list[dict[str, object]] | None = None,
    image_data: str | None = None,
) -> dict | None:
    document = _template_collection().find_one({"id": template_id})
    if not document:
        return None

    normalized_name = name.strip() or "Untitled template"
    normalized_assignments, normalized_category = _normalize_taxonomy_assignments(
        taxonomy_assignments, category
    )

    update_fields: dict[str, object] = {
        "name": normalized_name[:100],
        "category": normalized_category,
        "description": re.sub(r"\s+", " ", description).strip()[:180],
        "taxonomyAssignments": normalized_assignments,
    }
    if image_data and image_data.strip():
        _validate_template_image(image_data)

        image_url, public_id = _upload_to_cloudinary(image_data=image_data, template_id=template_id)
        update_fields.update({"imageUrl": image_url, "cloudinaryPublicId": public_id})

    _template_collection().update_one({"id": template_id}, {"$set": update_fields})
    return _serialize_template({**document, **update_fields})


def delete_admin_template(template_id: str) -> bool:
    document = _template_collection().find_one({"id": template_id})
    if not document:
        return False

    # The template record is the source of truth for the library. A temporary
    # Cloudinary outage must not prevent an administrator from removing a
    # template that is no longer available to the product.
    delete_result = _template_collection().delete_one({"id": template_id})
    if not delete_result.deleted_count:
        return False

    public_id = str(document.get("cloudinaryPublicId", "")).strip()
    if public_id:
        try:
            _delete_from_cloudinary(public_id)
        except Exception:
            # Retaining an orphaned image is preferable to retaining a
            # supposedly deleted template. The asset can be safely removed by
            # Cloudinary lifecycle tooling or a later cleanup pass.
            logger.exception(
                "Deleted template %s from MongoDB but could not remove Cloudinary asset %s",
                template_id,
                public_id,
            )
    return True
