#!/bin/bash
# ============================================================
# MockITV — One-click startup script (macOS / Linux)
# Usage: chmod +x start.sh && ./start.sh
# ============================================================

# Exit immediately if a command exits with a non-zero status,
# but we will handle process cleaning manually.
set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       🚀 MockITV — Starting Project          ║"
echo "║       AI-Powered Mock Interview Platform     ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Initialize PID variables
BACKEND_PID=""
FRONTEND_PID=""

# ---- Cleanup Function ----
cleanup() {
    # Disable trap to avoid recursion
    trap - INT TERM HUP EXIT
    
    echo ""
    echo "🛑 Stopping all servers..."
    
    if [ -n "$BACKEND_PID" ]; then
        echo "   Stopping backend server (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        echo "   Stopping frontend server (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    
    # Force clean ports just in case processes are still hanging
    for port in 3000 8000; do
        pid=$(lsof -t -i:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            echo "   Force-killing remaining process on port $port (PID: $pid)..."
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    echo "👋 All servers stopped successfully."
    exit 0
}

# Register the cleanup function for INT, TERM, and HUP signals
trap cleanup INT TERM HUP

# ---- Port Cleanup ----
echo "🧹 Checking and clearing ports 3000 and 8000..."
for port in 3000 8000; do
    pid=$(lsof -t -i:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo "   Port $port is in use. Killing process $pid..."
        kill -9 $pid 2>/dev/null || true
        sleep 0.5
    fi
done
echo "✅ Ports are clean."
echo ""

# ---- Backend Setup ----
echo "📦 [Backend] Installing Python dependencies..."
cd "$ROOT_DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -q -r requirements.txt
else
    source venv/bin/activate
fi

# Create .env from example if not exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    echo "   Please edit backend/.env and add your OPENAI_API_KEY"
    cp .env.example .env
fi

echo "✅ [Backend] Dependencies installed."
echo "⏳ [Backend] Checking and downloading AI model if needed..."
python download_model.py
echo "🚀 [Backend] Starting FastAPI server on port 8000 using Uvicorn..."
# Run using python -m uvicorn to ensure using virtual environment's uvicorn
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > >(tee "$ROOT_DIR/logs/backend.log") 2>&1 &
BACKEND_PID=$!

# ---- Frontend Setup ----
echo ""
echo "📦 [Frontend] Installing Node.js dependencies..."
cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    npm install
fi

echo "✅ [Frontend] Dependencies ready."
echo "🚀 [Frontend] Starting Next.js dev server on port 3000..."
npm run dev > >(tee "$ROOT_DIR/logs/frontend.log") 2>&1 &
FRONTEND_PID=$!

# ---- Wait & Open Browser ----
echo ""
echo "⏳ Waiting for servers to start..."
sleep 5

# Open browser
if command -v open &> /dev/null; then
    open "http://localhost:3000"
elif command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅ MockITV is running!                      ║"
echo "║  🌐 Frontend: http://localhost:3000          ║"
echo "║  🔌 Backend:  http://localhost:8000          ║"
echo "║  📖 API Docs: http://localhost:8000/docs     ║"
echo "║                                              ║"
echo "║  Press Ctrl+C to stop all servers            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Wait for background processes to keep script running
wait
