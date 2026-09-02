"""Pydantic request/response schemas."""
from __future__ import annotations

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    login: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserMe(BaseModel):
    id: int
    full_name: str
    role: str
    employee_code: str | None = None
    permissions: dict = Field(default_factory=dict)


class EmployeeOut(BaseModel):
    id: int
    full_name: str
    position: str
    brigade: str | None = None
    phone: str | None = None
    avatar_color: str | None = None
    is_active: bool = True


class ScheduleOut(BaseModel):
    id: int
    date: str
    shift_id: int
    shift_name: str
    start_time: str
    end_time: str
    color: str
    assigned_count: int
    assigned_employee_ids: list[int] = Field(default_factory=list)


class AssignRequest(BaseModel):
    employee_ids: list[int]


class AttendanceStats(BaseModel):
    total: int
    present: int
    late: int
    absent: int
