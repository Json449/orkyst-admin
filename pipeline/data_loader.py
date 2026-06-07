"""
Step 1 — Data Loader
Reads analytics_sample_responses.json and returns normalised domain records.
In production: replace _load_from_file() with _load_from_api() calls.
"""

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class DataRecord:
    endpoint: str
    domain: str
    payload: dict[str, Any]


def load(json_path: str | Path) -> list[DataRecord]:
    path = Path(json_path)
    raw = json.loads(path.read_text())

    records: list[DataRecord] = []

    overview = raw.get("GET /api/analytics/overview", {}).get("response", {})
    if overview:
        records.append(DataRecord("GET /api/analytics/overview", "overview", overview))

    account = raw.get("GET /api/analytics/account/:id", {}).get("response", {})
    if account:
        records.append(DataRecord("GET /api/analytics/account/:id", "account", account))

    posts = raw.get("GET /api/analytics/posts", {}).get("response", {})
    if posts:
        records.append(DataRecord("GET /api/analytics/posts", "posts", posts))

    sentiment = raw.get("GET /api/analytics/sentiment", {}).get("response", {})
    if sentiment:
        records.append(DataRecord("GET /api/analytics/sentiment", "sentiment", sentiment))

    trends = raw.get("GET /api/analytics/trends", {}).get("response", {})
    if trends:
        records.append(DataRecord("GET /api/analytics/trends", "trends", trends))

    recommendations = raw.get("GET /api/analytics/recommendations", {}).get("response", {})
    if recommendations:
        records.append(DataRecord("GET /api/analytics/recommendations", "recommendations", recommendations))

    return records
