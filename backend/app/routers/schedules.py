"""Schedule, shift and assignment endpoints (brigade swipe/bulk flows)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..database import get_connection
from ..models import AssignRequest, ScheduleOut
from .auth import get_current_user

router = APIRouter(prefix="/api", tags=["schedules"])


def _schedule_to_dict(row) -> ScheduleOut:
    conn = get_connection()
    assignments = conn.execute(
        "SELECT employee_id FROM assignments WHERE schedule_id = ?", (row["id"],)
    ).fetchall()
    conn.close()
    ids = [a["employee_id"] for a in assignments]
    return ScheduleOut(
        id=row["id"],
        date=row["date"],
        shift_id=row["shift_id"],
        shift_name=row["shift_name"],
        start_time=row["start_time"],
        end_time=row["end_time"],
        color=row["color"],
        assigned_count=len(ids),
        assigned_employee_ids=ids,
    )


@router.get("/schedules", response_model=list[ScheduleOut])
def list_schedules(
    date: str | None = Query(default=None, description="YYYY-MM-DD"),
    _user: dict = Depends(get_current_user),
) -> list[ScheduleOut]:
    conn = get_connection()
    sql = """
        SELECT s.id, s.shift_id, s.date, sh.name AS shift_name,
               sh.start_time, sh.end_time, sh.color
        FROM schedules s
        JOIN shifts sh ON sh.id = s.shift_id
    """
    params: list = []
    if date:
        sql += " WHERE s.date = ?"
        params.append(date)
    sql += " ORDER BY s.date, sh.start_time"
    rows = conn.execute(sql, params).fetchall()
    conn.close()
    return [_schedule_to_dict(r) for r in rows]


@router.post("/schedules/{schedule_id}/assign", response_model=ScheduleOut)
def assign_employees(
    schedule_id: int,
    body: AssignRequest,
    _user: dict = Depends(get_current_user),
) -> ScheduleOut:
    conn = get_connection()
    schedule = conn.execute(
        """
        SELECT s.id, s.shift_id, s.date, sh.name AS shift_name,
               sh.start_time, sh.end_time, sh.color
        FROM schedules s JOIN shifts sh ON sh.id = s.shift_id
        WHERE s.id = ?
        """,
        (schedule_id,),
    ).fetchone()
    if schedule is None:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Smena topilmadi")

    for emp_id in set(body.employee_ids):
        conn.execute(
            "INSERT OR IGNORE INTO assignments (schedule_id, employee_id) VALUES (?, ?)",
            (schedule_id, emp_id),
        )
    conn.commit()
    conn.close()
    return _schedule_to_dict(schedule)


@router.delete("/schedules/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_assignment(assignment_id: int, _user: dict = Depends(get_current_user)) -> None:
    conn = get_connection()
    cursor = conn.execute(
        "DELETE FROM assignments WHERE id = ?", (assignment_id,)
    )
    conn.commit()
    conn.close()
    if cursor.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Biriktirish topilmadi",
        )


@router.get("/schedules/{schedule_id}/employees", response_model=list[int])
def schedule_employees(schedule_id: int, _user: dict = Depends(get_current_user)) -> list[int]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT employee_id FROM assignments WHERE schedule_id = ?", (schedule_id,)
    ).fetchall()
    conn.close()
    return [r["employee_id"] for r in rows]
