"""Attendance statistics and records endpoints."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query

from ..database import get_connection
from ..models import AttendanceStats
from .auth import get_current_user

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("/stats/today", response_model=AttendanceStats)
def stats_today(_user: dict = Depends(get_current_user)) -> AttendanceStats:
    today = datetime.now().strftime("%Y-%m-%d")
    conn = get_connection()
    rows = conn.execute(
        "SELECT status, COUNT(*) AS cnt FROM attendance_records WHERE date = ? GROUP BY status",
        (today,),
    ).fetchall()
    total_employees = conn.execute("SELECT COUNT(*) FROM employees WHERE is_active = 1").fetchone()[0]
    conn.close()

    counts = {r["status"]: r["cnt"] for r in rows}
    present = counts.get("present", 0)
    late = counts.get("late", 0)
    absent = counts.get("absent", total_employees - present - late)
    return AttendanceStats(total=total_employees, present=present, late=late, absent=absent)


@router.get("/records")
def records(
    date: str | None = Query(default=None, description="YYYY-MM-DD"),
    employee_id: int | None = Query(default=None),
    _user: dict = Depends(get_current_user),
) -> list[dict]:
    conn = get_connection()
    sql = """
        SELECT ar.id, ar.employee_id, e.full_name, ar.date,
               ar.check_in, ar.check_out, ar.status
        FROM attendance_records ar
        JOIN employees e ON e.id = ar.employee_id
    """
    conditions: list[str] = []
    params: list = []
    if date:
        conditions.append("ar.date = ?")
        params.append(date)
    if employee_id:
        conditions.append("ar.employee_id = ?")
        params.append(employee_id)
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY ar.date DESC, e.full_name"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.get("/events")
def events(
    date: str | None = Query(default=None),
    _user: dict = Depends(get_current_user),
) -> list[dict]:
    """List distinct attendance event days with per-status counts."""
    conn = get_connection()
    sql = """
        SELECT date,
               SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present,
               SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late,
               SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent
        FROM attendance_records
    """
    params: list = []
    if date:
        sql += " WHERE date = ?"
        params.append(date)
    sql += " GROUP BY date ORDER BY date DESC"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]
