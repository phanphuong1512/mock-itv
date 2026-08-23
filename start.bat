@echo off
setlocal
chcp 65001 >nul

echo.
echo ============================================================
echo              MockITV - Starting Project
echo       AI-Powered Mock Interview Platform
echo ============================================================
echo.

set ROOT_DIR=%~dp0

REM ============================================================
REM CLEAN PORTS 3000 AND 8000
REM ============================================================

echo 🧹 Checking and clearing ports 3000 and 8000...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr LISTENING') do (
    echo     Killing PID %%a on port 3000
    taskkill /F /PID %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000" ^| findstr LISTENING') do (
    echo     Killing PID %%a on port 8000
    taskkill /F /PID %%a >nul 2>&1
)

echo ✅ Ports are clean.
echo.

REM ============================================================
REM BACKEND SETUP
REM ============================================================

echo 📦 [Backend] Installing Python dependencies...
cd /d "%ROOT_DIR%backend"

if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] Installing dependencies...
    python -m pip install -q -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)

if not exist ".env" (
    echo ⚠️  No .env file found. Copying from .env.example...
    echo        Please edit backend\.env and add your OPENAI_API_KEY
    copy .env.example .env >nul
)

echo ✅ [Backend] Dependencies installed.
echo ⏳ [Backend] Checking and downloading AI model if needed...
python download_model.py
echo 🚀 [Backend] Starting FastAPI server on port 8000 using Uvicorn...

start "MockITV Backend" cmd /k "cd /d %ROOT_DIR%backend && call venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.

REM ============================================================
REM FRONTEND SETUP
REM ============================================================

echo 📦 [Frontend] Installing Node.js dependencies...
cd /d "%ROOT_DIR%frontend"

if not exist "node_modules" (
    call npm install
)

echo ✅ [Frontend] Dependencies ready.
echo 🚀 [Frontend] Starting Next.js dev server on port 3000...

start "MockITV Frontend" cmd /k "cd /d %ROOT_DIR%frontend && npm run dev"

echo.

REM ============================================================
REM WAIT AND OPEN BROWSER
REM ============================================================

echo ⏳ Waiting for servers to start...
timeout /t 8 /nobreak >nul

start http://localhost:3000

echo.
echo ============================================================
echo                 MockITV IS RUNNING
echo ============================================================
echo  Frontend : http://localhost:3000
echo  Backend  : http://localhost:8000
echo  API Docs : http://localhost:8000/docs
echo.
echo  NOTE: Keep backend/frontend terminals open.
echo        Close those terminals to stop the servers.
echo ============================================================
echo.

pause
