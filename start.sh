#!/bin/bash
# ============================================================
# MockITV — One-click startup script (macOS / Linux)
# Usage: chmod +x start.sh && ./start.sh
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║       🚀 MockITV — Starting Project          ║"
echo "║       AI-Powered Mock Interview Platform      ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ---- Backend Setup ----
echo "📦 [Backend] Installing Python dependencies..."
cd "$ROOT_DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

pip install -q -r requirements.txt

# Create .env from example if not exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    echo "   Please edit backend/.env and add your GEMINI_API_KEY"
    cp .env.example .env
fi

echo "✅ [Backend] Dependencies installed."
echo "🚀 [Backend] Starting FastAPI server on port 8000..."
python main.py &
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
npm run dev &
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
echo "║  ✅ MockITV is running!                       ║"
echo "║  🌐 Frontend: http://localhost:3000            ║"
echo "║  🔌 Backend:  http://localhost:8000            ║"
echo "║  📖 API Docs: http://localhost:8000/docs       ║"
echo "║                                                ║"
echo "║  Press Ctrl+C to stop all servers              ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Trap Ctrl+C to kill both processes
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
