@echo off
chcp 65001 >nul
REM ============================================================
REM MockITV — One-click startup script (Windows)
REM Usage: Double-click start.bat or run in terminal
REM ============================================================

echo.
echo ╔══════════════════════════════════════════════╗
echo ║       🚀 MockITV — Starting Project          ║
echo ║       AI-Powered Mock Interview Platform     ║
echo ╚══════════════════════════════════════════════╝
echo.

set ROOT_DIR=%~dp0

REM ---- Backend Setup ----
echo 📦 [Backend] Installing Python dependencies...
cd /d "%ROOT_DIR%backend"

if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate.bat

pip install -q -r requirements.txt

if not exist ".env" (
    echo ⚠️  No .env file found. Copying from .env.example...
    echo    Please edit backend\.env and add your GEMINI_API_KEY
    copy .env.example .env
)

echo ✅ [Backend] Dependencies installed.
echo 🚀 [Backend] Starting FastAPI server on port 8000...
start /B python main.py

REM ---- Frontend Setup ----
echo.
echo 📦 [Frontend] Installing Node.js dependencies...
cd /d "%ROOT_DIR%frontend"

if not exist "node_modules" (
    call npm install
)

echo ✅ [Frontend] Dependencies ready.
echo 🚀 [Frontend] Starting Next.js dev server on port 3000...
start /B npm run dev

REM ---- Wait & Open Browser ----
echo.
echo ⏳ Waiting for servers to start...
timeout /t 5 /nobreak >nul

start http://localhost:3000

echo.
echo ╔══════════════════════════════════════════════╗
echo ║  ✅ MockITV is running!                       ║
echo ║  🌐 Frontend: http://localhost:3000            ║
echo ║  🔌 Backend:  http://localhost:8000            ║
echo ║  📖 API Docs: http://localhost:8000/docs       ║
echo ║                                                ║
echo ║  Close this window to stop all servers        ║
echo ╚══════════════════════════════════════════════╝
echo.

pause
