"""Authentication endpoints (login + current user)."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..database import get_connection
from ..models import LoginRequest, TokenResponse, UserMe
from ..security import create_access_token, decode_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> dict:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentifikatsiya tokeni topilmadi",
        )
    try:
        payload = decode_token(credentials.credentials)
    except Exception as exc:  # noqa: BLE001 - jwt errors are broad
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token muddati tugagan yoki noto'g'ri",
        ) from exc

    user_id = int(payload.get("sub", 0))
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Foydalanuvchi topilmadi")
    return dict(user)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest) -> TokenResponse:
    conn = get_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE phone = ? OR employee_code = ?",
        (body.login.strip(), body.login.strip()),
    ).fetchone()
    conn.close()

    if user is None or not verify_password(body.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login yoki parol noto'g'ri",
        )

    token = create_access_token(user["id"], user["role"])
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserMe)
def me(user: dict = Depends(get_current_user)) -> UserMe:
    try:
        permissions = json.loads(user.get("permissions") or "{}")
    except json.JSONDecodeError:
        permissions = {}
    return UserMe(
        id=user["id"],
        full_name=user["full_name"],
        role=user["role"],
        employee_code=user.get("employee_code"),
        permissions=permissions,
    )
