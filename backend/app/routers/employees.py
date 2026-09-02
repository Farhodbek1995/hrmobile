"""Employee endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..database import get_connection
from ..models import EmployeeOut
from .auth import get_current_user

router = APIRouter(prefix="/api/employees", tags=["employees"])


def _employee_to_dict(row) -> EmployeeOut:
    data = dict(row)
    return EmployeeOut(
        id=data["id"],
        full_name=data["full_name"],
        position=data["position"],
        brigade=data.get("brigade"),
        phone=data.get("phone"),
        avatar_color=data.get("avatar_color"),
        is_active=bool(data.get("is_active", 1)),
    )


@router.get("", response_model=list[EmployeeOut])
def list_employees(
    search: str | None = Query(default=None, description="Ism bo'yicha qidiruv"),
    brigade: str | None = Query(default=None),
    _user: dict = Depends(get_current_user),
) -> list[EmployeeOut]:
    conn = get_connection()
    sql = "SELECT * FROM employees WHERE is_active = 1"
    params: list = []

    if search:
        sql += " AND full_name LIKE ?"
        params.append(f"%{search}%")
    if brigade:
        sql += " AND brigade = ?"
        params.append(brigade)

    sql += " ORDER BY full_name"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [_employee_to_dict(r) for r in rows]


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, _user: dict = Depends(get_current_user)) -> EmployeeOut:
    conn = get_connection()
    row = conn.execute("SELECT * FROM employees WHERE id = ?", (employee_id,)).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xodim topilmadi")
    return _employee_to_dict(row)
