# MockITV — Isolated Backend Integration Test Suite
# Usage: Run "python test_main.py" from the backend directory to execute all tests.

import sys
import os
import time
import json
from unittest.mock import patch, AsyncMock

# Add root directory to path to resolve imports cleanly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import get_db, Base
from models import MockSession, MockJob, SessionQuestion
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# =====================================================================
# 🛠️ ISOLATED TEST DATABASE SETUP (sqlite:///./test_mockitv.db)
# =====================================================================
TEST_DATABASE_URL = "sqlite:///./test_mockitv.db"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Recreate all tables from scratch on every test suite run
Base.metadata.drop_all(bind=test_engine)
Base.metadata.create_all(bind=test_engine)

# Dependency override
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# =====================================================================
# 🌱 SEED DATA FOR TEST DATABASE
# =====================================================================
def seed_test_database():
    db = TestingSessionLocal()
    
    # 1. Seed Mock Job
    job = MockJob(
        id=1,
        title="Software Engineer Intern",
        company="Tech Unicorn",
        category="backend",
        level="Intern",
        department="Backend",
        tech_stack=json.dumps(["Java", "Spring Boot", "MySQL"], ensure_ascii=False),
        rounds=3,
        logo_url="https://api.dicebear.com/7.x/shapes/svg?seed=TechUnicorn&backgroundColor=0B1120"
    )
    db.add(job)
    
    # 2. Seed Mock Session (Completed)
    session1 = MockSession(
        id=1,
        job_id=1,
        status="completed",
        overall_score=75,
        technical_score=80,
        communication_score=70,
        problem_solving_score=75,
        ai_overall_feedback="Excellent performance overall.",
        strengths=json.dumps(["Java", "Spring Boot"], ensure_ascii=False),
        weaknesses=json.dumps(["System design details"], ensure_ascii=False),
        topics_to_learn=json.dumps(["Advanced Spring Boot"], ensure_ascii=False),
        resources=json.dumps(["Spring Docs"], ensure_ascii=False)
    )
    db.add(session1)
    
    # 3. Seed Question for Session 1
    q1 = SessionQuestion(
        id=1,
        session_id=1,
        question_order=1,
        tag="technical",
        question_text="REST API là gì?",
        user_answer="REST API là chuẩn thiết kế API stateless...",
        score=85,
        analysis_chunks=json.dumps([{"id": "a0", "text": "REST API là chuẩn thiết kế API stateless...", "type": "success", "popupTitle": "Chính xác", "popupDesc": "Rất tốt", "statusText": "Phù hợp"}], ensure_ascii=False),
        feedback_chunks=json.dumps([{"id": "f0", "text": "Câu trả lời đúng trọng tâm.", "type": "info", "popupTitle": "Nhận xét", "popupDesc": "Tốt", "statusText": "Nên giữ vững"}], ensure_ascii=False),
        strengths=json.dumps(["Hiểu về statelessness"], ensure_ascii=False),
        weaknesses=json.dumps([]),
        recommendations=json.dumps(["Mở rộng về HTTP codes"])
    )
    db.add(q1)
    
    # 4. Seed Mock Session (In progress)
    session2 = MockSession(
        id=2,
        job_id=1,
        status="in_progress",
        overall_score=0,
        technical_score=0,
        communication_score=0,
        problem_solving_score=0,
        ai_overall_feedback="",
        strengths=json.dumps([], ensure_ascii=False),
        weaknesses=json.dumps([], ensure_ascii=False),
        topics_to_learn=json.dumps([], ensure_ascii=False),
        resources=json.dumps([], ensure_ascii=False)
    )
    db.add(session2)
    
    # 5. Seed Question for Session 2
    q2 = SessionQuestion(
        id=2,
        session_id=2,
        question_order=1,
        tag="technical",
        question_text="Spring Boot là gì?",
        user_answer="Spring Boot giúp tạo ứng dụng Java độc lập, cấu hình sẵn...",
        score=0
    )
    db.add(q2)
    
    db.commit()
    db.close()

# Perform Seeding
seed_test_database()

client = TestClient(app)

# ANSI colors for beautiful terminal output
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_header(title):
    print(f"\n{BOLD}{CYAN}╔════════════════════════════════════════════════════════════╗")
    print(f"║ {title.center(58)} ║")
    print(f"╚════════════════════════════════════════════════════════════╝{RESET}\n")

def print_footer(passed_count, total_count, duration):
    print(f"\n{BOLD}{CYAN}╚════════════════════════════════════════════════════════════╝{RESET}")
    color = GREEN if passed_count == total_count else RED
    print(f"\n{BOLD}Test Summary: {color}{passed_count}/{total_count} Passed{RESET} ({duration:.2f}s)\n")

def log_test(name, passed, detail=""):
    status = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f" {status} : {BOLD}{name}{RESET}")
    if detail:
        print(f"            ↳ {detail}")

def test_get_jobs():
    """Verify that the jobs list endpoint works and returns pre-seeded job postings."""
    start_time = time.time()
    response = client.get("/api/jobs")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert isinstance(data, list), "Expected job data to be a JSON list"
    assert len(data) > 0, "Expected at least one job posting in the database"
    
    # Check essential job keys
    first_job = data[0]
    required_keys = ["id", "title", "company", "level", "techStack", "rounds"]
    for key in required_keys:
        assert key in first_job, f"Job schema missing required key: {key}"
        
    duration = time.time() - start_time
    return f"Successfully fetched {len(data)} job postings in {duration:.3f}s. (First: {first_job['title']} at {first_job['company']})"

def test_get_sessions():
    """Verify that the session history endpoint loads mock sessions correctly."""
    start_time = time.time()
    response = client.get("/api/sessions")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert isinstance(data, list), "Expected sessions history to be a JSON list"
    assert len(data) > 0, "Expected at least one mock session"
    
    duration = time.time() - start_time
    return f"Successfully loaded {len(data)} mock interview sessions in {duration:.3f}s."

def test_create_session():
    """Verify that a candidate can start/create a new mock interview session for a job."""
    start_time = time.time()
    
    # 1. Fetch available jobs to get a valid jobId
    jobs_response = client.get("/api/jobs")
    assert jobs_response.status_code == 200
    jobs = jobs_response.json()
    assert len(jobs) > 0
    target_job = jobs[0]
    
    # 2. Post request to create a new session (with generate_questions mocked)
    mock_questions = [
        {"question_text": "Mock Question 1", "tag": "technical"},
        {"question_text": "Mock Question 2", "tag": "behavioral"},
        {"question_text": "Mock Question 3", "tag": "problem-solving"}
    ]
    with patch("routes.sessions.generate_questions", new_callable=AsyncMock, return_value=mock_questions):
        payload = {"job_id": target_job["id"]}
        response = client.post("/api/sessions", json=payload)
        
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    session_data = response.json()
    
    # 3. Assert schema
    assert "id" in session_data, "Created session missing 'id'"
    assert session_data["status"] == "in_progress", f"Expected 'in_progress', got {session_data['status']}"
    assert "questions" in session_data, "Created session did not return list of interview questions"
    assert len(session_data["questions"]) > 0, "Created session has 0 questions generated"
    
    duration = time.time() - start_time
    return f"Created Session ID {session_data['id']} for '{target_job['title']}' with {len(session_data['questions'])} questions in {duration:.3f}s."

def test_get_session_details():
    """Verify that retrieving details for an active or completed mock session works."""
    start_time = time.time()
    
    # 1. Query the first session ID
    db = TestingSessionLocal()
    first_session = db.query(MockSession).first()
    db.close()
    
    assert first_session is not None, "Database has no sessions to fetch details for"
    
    # 2. Get detailed session information
    response = client.get(f"/api/sessions/{first_session.id}")
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    
    assert data["id"] == first_session.id, f"Session ID mismatch: expected {first_session.id}, got {data['id']}"
    assert "questions" in data, "Session detail schema missing 'questions'"
    
    duration = time.time() - start_time
    return f"Retrieved detailed payload for Session ID {first_session.id} in {duration:.3f}s."

def test_evaluate_session_mock():
    """Verify evaluating mock sessions works gracefully and updates completion status."""
    start_time = time.time()
    
    # 1. Find or create a session to evaluate
    db = TestingSessionLocal()
    session = db.query(MockSession).filter(MockSession.status == "in_progress").first()
    db.close()
    
    assert session is not None, "No session available to test evaluation"
    
    # 2. Trigger evaluate with batch_evaluate_session mocked
    mock_results = {
        "evaluations": [
            {
                "score": 85,
                "analysis_chunks": [{"id": "a0", "text": "Mock Answer Segment", "type": "success", "popupTitle": "Tốt", "popupDesc": "Khá tốt", "statusText": "Đạt"}],
                "feedback_chunks": [{"id": "f0", "text": "Mock Feedback", "type": "info", "popupTitle": "Gợi ý", "popupDesc": "Bổ sung", "statusText": "Nên thêm"}],
                "strengths": ["Mock Strength"],
                "weaknesses": ["Mock Weakness"],
                "recommendations": ["Mock Rec"]
            }
        ],
        "overall": {
            "overall_score": 80,
            "technical_score": 85,
            "communication_score": 75,
            "problem_solving_score": 80,
            "feedback_text": "Overall Good",
            "strengths": ["Overall Strength"],
            "weaknesses": ["Overall Weakness"],
            "topics_to_learn": ["Topic"],
            "resources": ["Resource"]
        }
    }
    
    with patch("routes.sessions.batch_evaluate_session", new_callable=AsyncMock, return_value=mock_results):
        response = client.post(f"/api/sessions/{session.id}/evaluate")
        
    assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
    data = response.json()
    assert data["status"] == "completed"
    
    duration = time.time() - start_time
    return f"AI Evaluation PASSED successfully for Session ID {session.id} in {duration:.3f}s."

def main():
    print_header("MockITV Integration Test Suite")
    
    tests = [
        ("GET /api/jobs (Job Openings List)", test_get_jobs),
        ("GET /api/sessions (Sessions History)", test_get_sessions),
        ("POST /api/sessions (Create Mock Session)", test_create_session),
        ("GET /api/sessions/{id} (Session Details)", test_get_session_details),
        ("POST /api/sessions/{id}/evaluate (Evaluate)", test_evaluate_session_mock),
    ]
    
    passed_count = 0
    total_count = len(tests)
    start_suite_time = time.time()
    
    for name, test_func in tests:
        try:
            detail = test_func()
            log_test(name, True, detail)
            passed_count += 1
        except AssertionError as ae:
            log_test(name, False, str(ae))
        except Exception as e:
            log_test(name, False, f"Unexpected error: {str(e)}")
            
    suite_duration = time.time() - start_suite_time
    print_footer(passed_count, total_count, suite_duration)
    
    # Cleanup temporary test database file
    try:
        if os.path.exists("./test_mockitv.db"):
            os.remove("./test_mockitv.db")
        if os.path.exists("./test_mockitv.db-wal"):
            os.remove("./test_mockitv.db-wal")
        if os.path.exists("./test_mockitv.db-shm"):
            os.remove("./test_mockitv.db-shm")
    except Exception:
        pass
        
    if passed_count == total_count:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
