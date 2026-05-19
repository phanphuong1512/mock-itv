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

REM ---- Port Cleanup ----
echo 🧹 Checking and clearing ports 3000 and 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :3000') do (
    echo    Killing process on port 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :8000') do (
    echo    Killing process on port 8000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Ports are clean.
echo.

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
echo 🚀 [Backend] Starting FastAPI server on port 8000 using Uvicorn...
start /B python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

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
echo ║  ✅ MockITV is running!                      ║
echo ║  🌐 Frontend: http://localhost:3000          ║
echo ║  🔌 Backend:  http://localhost:8000          ║
echo ║  📖 API Docs: http://localhost:8000/docs     ║
echo ║                                              ║
echo ║  Press ENTER in this window to stop servers  ║
echo ╚══════════════════════════════════════════════╝
echo.

pause

REM ---- Cleanup on exit ----
echo 🛑 Stopping all servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :3000') do (
    echo    Stopping process on port 3000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :8000') do (
    echo    Stopping process on port 8000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)
echo 👋 Done! All servers stopped.

