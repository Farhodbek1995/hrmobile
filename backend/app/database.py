"""In-memory SQLite database with demo seed data.

The mobile plan targets a real production database (PostgreSQL) behind the
existing FastAPI service. This module provides a self-contained, zero-setup
SQLite store so the whole mobile backend can be run and tested locally.
"""
from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from .security import hash_password

DB_PATH = Path(__file__).resolve().parent / "hr_mobile.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Create tables and seed demo data if the database is empty."""
    conn = get_connection()
    cur = conn.cursor()

    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'brigadir', 'employee')),
            employee_code TEXT UNIQUE,
            permissions TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            position TEXT NOT NULL,
            brigade TEXT,
            phone TEXT,
            avatar_color TEXT,
            is_active INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            color TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shift_id INTEGER NOT NULL REFERENCES shifts(id),
            date TEXT NOT NULL,
            UNIQUE (shift_id, date)
        );

        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            UNIQUE (schedule_id, employee_id)
        );

        CREATE TABLE IF NOT EXISTS attendance_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL REFERENCES employees(id),
            date TEXT NOT NULL,
            check_in TEXT,
            check_out TEXT,
            status TEXT NOT NULL DEFAULT 'absent'
        );
        """
    )

    # Seed only when the users table is empty.
    count = cur.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    if count == 0:
        seed(conn)

    conn.commit()
    conn.close()


def seed(conn: sqlite3.Connection) -> None:
    """Insert representative demo data."""
    cur = conn.cursor()
    today = datetime.now()
    date_str = today.strftime("%Y-%m-%d")

    users = [
        ("+998901112233", "admin123", "Azizbek Karimov", "admin", "HR-0001"),
        ("+998901234567", "brigadir1", "Azizbek", "brigadir", "HR-0042"),
        ("+998909998877", "ishchi1", "Aliyev Vali", "employee", "EMP-1001"),
    ]
    for phone, password, name, role, code in users:
        cur.execute(
            "INSERT INTO users (phone, password, full_name, role, employee_code, permissions) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (phone, hash_password(password), name, role, code, "{}"),
        )

    employees = [
        ("Aliyev Vali", "Payvandchi", "Brigada 1", "+998901234567", "#6366F1"),
        ("Toshmatov Eshmat", "Quruvchi", "Brigada 1", "+998901234568", "#10B981"),
        ("Karimov Rustam", "Usta", "Brigada 1", "+998901234569", "#F59E0B"),
        ("Nazarov Umid", "Haydovchi", "Brigada 1", "+998901234570", "#EF4444"),
        ("Saidov Sanjar", "Elektr mutaxassisi", "Brigada 1", "+998901234571", "#8B5CF6"),
        ("Rahimov Botir", "Payvandchi", "Brigada 2", "+998901234572", "#EC4899"),
        ("Yo'ldoshev Jasur", "Montajchi", "Brigada 2", "+998901234573", "#14B8A6"),
    ]
    for emp in employees:
        cur.execute(
            "INSERT INTO employees (full_name, position, brigade, phone, avatar_color) "
            "VALUES (?, ?, ?, ?, ?)",
            emp,
        )

    shifts = [
        ("Ertalabki smena", "08:00", "17:00", "#4F46E5"),
        ("Tungi smena", "20:00", "05:00", "#6366F1"),
    ]
    for shift in shifts:
        cur.execute(
            "INSERT INTO shifts (name, start_time, end_time, color) VALUES (?, ?, ?, ?)",
            shift,
        )

    # Create schedules for the next 10 days across both shifts.
    for offset in range(10):
        day = today + timedelta(days=offset)
        day_str = day.strftime("%Y-%m-%d")
        for shift_id in (1, 2):
            cur.execute(
                "INSERT INTO schedules (shift_id, date) VALUES (?, ?)",
                (shift_id, day_str),
            )

    # Pre-assign a few employees for today's morning shift.
    cur.execute(
        "INSERT INTO assignments (schedule_id, employee_id) "
        "SELECT s.id, e.id FROM schedules s, employees e "
        "WHERE s.date = ? AND s.shift_id = 1 AND e.id IN (1, 2, 4)",
        (date_str,),
    )

    # Seed attendance records for the past 7 days.
    statuses = ["present", "late", "absent"]
    for offset in range(7):
        day = today - timedelta(days=offset)
        day_str = day.strftime("%Y-%m-%d")
        for emp_id in range(1, 8):
            status = statuses[(emp_id + offset) % len(statuses)]
            check_in = f"08:0{(emp_id % 9) + 1}" if status != "absent" else None
            check_out = f"17:1{(emp_id % 9) + 1}" if status != "absent" else None
            cur.execute(
                "INSERT INTO attendance_records "
                "(employee_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)",
                (emp_id, day_str, check_in, check_out, status),
            )


def row_to_dict(row: sqlite3.Row | None) -> dict | None:
    return dict(row) if row is not None else None
