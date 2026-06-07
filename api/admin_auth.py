from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).parent.parent
DEFAULT_DB_PATH = ROOT / "data" / "admin.sqlite3"
SESSION_MAX_AGE_SECONDS = 60 * 60 * 8


def db_path() -> Path:
    return Path(os.getenv("ADMIN_DB_PATH", DEFAULT_DB_PATH))


def ensure_admin_db() -> None:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'admin',
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                last_login_at TEXT
            )
            """
        )
        conn.commit()


def upsert_admin_user(email: str, password: str) -> None:
    ensure_admin_db()
    normalized_email = email.strip().lower()
    now = _utc_now()
    with sqlite3.connect(db_path()) as conn:
        conn.execute(
            """
            INSERT INTO admin_users (email, password_hash, role, is_active, created_at)
            VALUES (?, ?, 'admin', 1, ?)
            ON CONFLICT(email) DO UPDATE SET
                password_hash = excluded.password_hash,
                role = 'admin',
                is_active = 1
            """,
            (normalized_email, _hash_password(password), now),
        )
        conn.commit()


def authenticate_admin(email: str, password: str) -> dict[str, Any] | None:
    ensure_admin_db()
    normalized_email = email.strip().lower()
    with sqlite3.connect(db_path()) as conn:
        conn.row_factory = sqlite3.Row
        user = conn.execute(
            """
            SELECT id, email, password_hash, role
            FROM admin_users
            WHERE email = ? AND is_active = 1
            """,
            (normalized_email,),
        ).fetchone()
        if not user or not _verify_password(password, user["password_hash"]):
            return None

        conn.execute(
            "UPDATE admin_users SET last_login_at = ? WHERE id = ?",
            (_utc_now(), user["id"]),
        )
        conn.commit()

    return {"id": user["id"], "email": user["email"], "role": user["role"]}


def create_session(admin: dict[str, Any]) -> str:
    expires_at = int((datetime.now(timezone.utc) + timedelta(seconds=SESSION_MAX_AGE_SECONDS)).timestamp())
    payload = {
        "sub": str(admin["id"]),
        "email": admin["email"],
        "role": admin["role"],
        "exp": expires_at,
    }
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    payload_b64 = _b64encode(payload_json)
    signature = hmac.new(_session_secret(), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64encode(signature)}"


def verify_session(token: str | None) -> dict[str, Any] | None:
    if not token or "." not in token:
        return None

    payload_b64, signature_b64 = token.rsplit(".", 1)
    expected = hmac.new(_session_secret(), payload_b64.encode("utf-8"), hashlib.sha256).digest()
    try:
        actual = _b64decode(signature_b64)
        payload = json.loads(_b64decode(payload_b64))
    except Exception:
        return None

    if not hmac.compare_digest(expected, actual):
        return None
    if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
        return None
    if payload.get("role") != "admin":
        return None

    return payload


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    rounds = 260_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, rounds)
    return f"pbkdf2_sha256${rounds}${_b64encode(salt)}${_b64encode(digest)}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, rounds, salt_b64, digest_b64 = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            _b64decode(salt_b64),
            int(rounds),
        )
        return hmac.compare_digest(digest, _b64decode(digest_b64))
    except Exception:
        return False


def _session_secret() -> bytes:
    configured = os.getenv("ADMIN_SESSION_SECRET")
    if configured:
        return configured.encode("utf-8")

    secret_path = db_path().with_name(".admin_session_secret")
    secret_path.parent.mkdir(parents=True, exist_ok=True)
    if not secret_path.exists():
        secret_path.write_text(secrets.token_urlsafe(48))
    return secret_path.read_text().strip().encode("utf-8")


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
