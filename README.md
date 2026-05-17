# MockITV

MockITV is an AI-powered mock interview platform that simulates real technical interviews using Google's Gemini AI. It evaluates candidate answers, highlights strengths/weaknesses in real-time, and generates personalized learning recommendations.

## Zero-Config Quick Start

This project uses an in-memory SQLite database that auto-seeds itself on the first run, making it extremely easy to set up and test.

### macOS & Linux
Just run the one-click startup script from the root directory:
```bash
./start.sh
```

### Windows
Double-click `start.bat` or run it from the command line:
```cmd
start.bat
```

The script will automatically:
1. Create a Python virtual environment and install backend dependencies.
2. Install frontend Node.js dependencies.
3. Start the FastAPI backend server on `http://localhost:8000`.
4. Start the Next.js frontend server on `http://localhost:3000`.
5. Open your default web browser to the application.

## Manual Setup

If you prefer to start the servers manually:

### 1. Backend Setup (Python 3.10+)
```bash
cd backend
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

pip install -r requirements.txt

# The API key has been added to .env for you.
python main.py
```
*The backend will automatically create `mockitv.db` and seed it with test data.*

### 2. Frontend Setup (Node.js 18+)
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack
- **Frontend:** Next.js 15, React 19, Tailwind CSS v4, Framer Motion
- **Backend:** FastAPI, SQLAlchemy, SQLite
- **AI Engine:** Google Gemini 2.0 Flash (Function Calling, Parallel Batching)
