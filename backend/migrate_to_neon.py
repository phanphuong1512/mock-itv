# -*- coding: utf-8 -*-
"""Database Migration script: Copy all tables and data from SQLite to Neon PostgreSQL."""

import sqlite3
from datetime import datetime, timezone
from dateutil import parser as date_parser
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from database import Base
from models import MockJob, MockSession, SessionQuestion, User

SQLITE_PATH = "mockitv.db"
NEON_URL = "postgresql://neondb_owner:npg_c7wGiAmO5zYg@ep-restless-unit-azfqjqfn-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"


def parse_dt(dt_str):
    if not dt_str:
        return datetime.now(timezone.utc)
    try:
        if isinstance(dt_str, datetime):
            return dt_str
        return date_parser.parse(str(dt_str))
    except Exception:
        return datetime.now(timezone.utc)


def run_migration():
    print("=" * 60)
    print("🚀 Starting Migration: SQLite -> Neon PostgreSQL")
    print("=" * 60)

    # 1. Connect to SQLite
    print("\n[1/5] Connecting to SQLite source database...")
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    # 2. Connect to Neon PostgreSQL
    print("[2/5] Connecting to Neon PostgreSQL destination...")
    pg_engine = create_engine(NEON_URL, pool_pre_ping=True)
    PgSession = sessionmaker(bind=pg_engine)
    pg_db = PgSession()

    # 3. Create tables in PostgreSQL
    print("[3/5] Creating tables in Neon PostgreSQL...")
    Base.metadata.create_all(bind=pg_engine)
    print("  ✓ Tables created successfully.")

    # 4. Migrate Data
    print("\n[4/5] Migrating data...")

    # 4.1 Migrate Users
    sqlite_cur.execute("SELECT * FROM users")
    users = sqlite_cur.fetchall()
    print(f"  - Migrating {len(users)} Users...")
    for u in users:
        u_dict = dict(u)
        existing = pg_db.query(User).filter(User.id == u_dict["id"]).first()
        if not existing:
            new_u = User(
                id=u_dict["id"],
                email=u_dict["email"],
                name=u_dict["name"],
                avatar_url=u_dict.get("avatar_url", ""),
                google_id=u_dict.get("google_id"),
                created_at=parse_dt(u_dict.get("created_at")),
            )
            pg_db.add(new_u)
    pg_db.commit()

    # 4.2 Migrate MockJobs
    sqlite_cur.execute("SELECT * FROM mock_jobs")
    jobs = sqlite_cur.fetchall()
    print(f"  - Migrating {len(jobs)} MockJobs...")
    for j in jobs:
        j_dict = dict(j)
        existing = pg_db.query(MockJob).filter(MockJob.id == j_dict["id"]).first()
        if not existing:
            new_j = MockJob(
                id=j_dict["id"],
                title=j_dict["title"],
                company=j_dict["company"],
                category=j_dict["category"],
                level=j_dict["level"],
                department=j_dict["department"],
                tech_stack=j_dict["tech_stack"],
                rounds=j_dict.get("rounds", 3),
                logo_url=j_dict.get("logo_url", ""),
            )
            pg_db.add(new_j)
    pg_db.commit()

    # 4.3 Migrate MockSessions
    sqlite_cur.execute("SELECT * FROM mock_sessions")
    sessions = sqlite_cur.fetchall()
    print(f"  - Migrating {len(sessions)} MockSessions...")
    for s in sessions:
        s_dict = dict(s)
        existing = pg_db.query(MockSession).filter(MockSession.id == s_dict["id"]).first()
        if not existing:
            new_s = MockSession(
                id=s_dict["id"],
                job_id=s_dict["job_id"],
                user_id=s_dict.get("user_id"),
                status=s_dict.get("status", "in_progress"),
                overall_score=s_dict.get("overall_score", 0),
                technical_score=s_dict.get("technical_score", 0),
                communication_score=s_dict.get("communication_score", 0),
                problem_solving_score=s_dict.get("problem_solving_score", 0),
                ai_overall_feedback=s_dict.get("ai_overall_feedback", ""),
                strengths=s_dict.get("strengths", "[]"),
                weaknesses=s_dict.get("weaknesses", "[]"),
                topics_to_learn=s_dict.get("topics_to_learn", "[]"),
                resources=s_dict.get("resources", "[]"),
                created_at=parse_dt(s_dict.get("created_at")),
            )
            pg_db.add(new_s)
    pg_db.commit()

    # 4.4 Migrate SessionQuestions
    sqlite_cur.execute("SELECT * FROM session_questions")
    questions = sqlite_cur.fetchall()
    print(f"  - Migrating {len(questions)} SessionQuestions...")
    for q in questions:
        q_dict = dict(q)
        existing = pg_db.query(SessionQuestion).filter(SessionQuestion.id == q_dict["id"]).first()
        if not existing:
            new_q = SessionQuestion(
                id=q_dict["id"],
                session_id=q_dict["session_id"],
                question_order=q_dict["question_order"],
                tag=q_dict.get("tag", "technical"),
                question_text=q_dict["question_text"],
                user_answer=q_dict.get("user_answer", ""),
                score=q_dict.get("score", 0),
                analysis_chunks=q_dict.get("analysis_chunks", "[]"),
                feedback_chunks=q_dict.get("feedback_chunks", "[]"),
                strengths=q_dict.get("strengths", "[]"),
                weaknesses=q_dict.get("weaknesses", "[]"),
                recommendations=q_dict.get("recommendations", "[]"),
            )
            pg_db.add(new_q)
    pg_db.commit()

    # 5. Fix PostgreSQL Auto-Increment Sequences (setval)
    print("\n[5/5] Synchronizing PostgreSQL sequence primary keys...")
    tables_to_sync = [
        "users",
        "mock_jobs",
        "mock_sessions",
        "session_questions",
    ]

    with pg_engine.connect() as conn:
        for tbl in tables_to_sync:
            try:
                res = conn.execute(text(f"SELECT COALESCE(MAX(id), 0) + 1 FROM {tbl}"))
                next_val = res.scalar()
                conn.execute(text(f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), :next_val, false)"), {"next_val": next_val})
                print(f"  ✓ Sequence for table '{tbl}' synchronized to next ID = {next_val}")
            except Exception as e:
                print(f"  ⚠️ Could not set sequence for {tbl}: {e}")
        conn.commit()

    # 6. Verification
    print("\n" + "=" * 60)
    print("✅ Migration Verification Summary:")
    print("=" * 60)
    pg_users_count = pg_db.query(User).count()
    pg_jobs_count = pg_db.query(MockJob).count()
    pg_sessions_count = pg_db.query(MockSession).count()
    pg_questions_count = pg_db.query(SessionQuestion).count()

    print(f"  Users:             SQLite={len(users):<4} -> Neon PostgreSQL={pg_users_count}")
    print(f"  Mock Jobs:         SQLite={len(jobs):<4} -> Neon PostgreSQL={pg_jobs_count}")
    print(f"  Mock Sessions:     SQLite={len(sessions):<4} -> Neon PostgreSQL={pg_sessions_count}")
    print(f"  Session Questions: SQLite={len(questions):<4} -> Neon PostgreSQL={pg_questions_count}")
    print("=" * 60)

    sqlite_conn.close()
    pg_db.close()
    print("\n🎉 MIGRATION TO NEON POSTGRESQL COMPLETED SUCCESSFULLY 100%!")


if __name__ == "__main__":
    run_migration()
