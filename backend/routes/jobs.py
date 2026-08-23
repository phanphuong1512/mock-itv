# -*- coding: utf-8 -*-
"""API routes for mock job listings."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from models import MockJob

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("")
def list_jobs(
    category: str = Query(None, description="Filter by category (backend, frontend, etc.)"),
    level: str = Query(None, description="Filter by level (Intern, Fresher, etc.)"),
    db: Session = Depends(get_db),
):
    """Get all mock job positions, optionally filtered (excluding internal custom mock job)."""
    query = db.query(MockJob).filter(MockJob.id != 999, MockJob.category != "custom")
    if category and category != "all":
        query = query.filter(MockJob.category == category)
    if level and level not in ("Tất cả", "all"):
        query = query.filter(MockJob.level == level)
    jobs = query.all()
    return [job.to_dict() for job in jobs]



@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get a single job by ID."""
    job = db.query(MockJob).filter(MockJob.id == job_id).first()
    if not job:
        return {"error": "Job not found"}
    return job.to_dict()
