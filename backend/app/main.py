"""FastAPI application entry point for the HR mobile backend."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import attendance, auth, employees, schedules

init_db()

app = FastAPI(title="HR Attendance Mobile API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(schedules.router)
app.include_router(attendance.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "hr-mobile-api", "version": "1.0.0"}


@app.get("/api/app/version")
def app_version() -> dict:
    return {"version": "1.0.0", "min_supported": "1.0.0", "force_update": False}
