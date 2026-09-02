"""Password hashing and JWT helpers.

Passwords are stored as salted SHA-256 hashes for demo purposes. JWT is used
for stateless authentication across the mobile app.
"""
from __future__ import annotations

import hashlib
import os
from datetime import datetime, timedelta, timezone

import jwt

SECRET_KEY = os.environ.get("HR_SECRET_KEY", "dev-secret-change-me-in-production")
ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 24


def hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    digest = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    candidate = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return candidate == digest


def create_access_token(user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
