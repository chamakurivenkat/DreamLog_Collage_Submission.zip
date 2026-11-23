#!/usr/bin/env bash
echo "=================================================="
echo "🌙 Starting DreamLog: SnoozeScience Sprint"
echo "=================================================="

# Move to backend directory
cd "$(dirname "$0")/backend" || exit 1

# Check if node_modules exists, install if missing
if [ ! -d "node_modules" ]; then
    echo "📦 First time run detected: Installing backend dependencies..."
    npm install
fi

echo "🚀 Launching DreamLog Application..."
echo "🌐 Opening http://localhost:5001 in your browser..."

# Open browser in background after 1.5 seconds
(sleep 2 && (open "http://localhost:5001" 2>/dev/null || xdg-open "http://localhost:5001" 2>/dev/null || true)) &

# Run server
node server.js
