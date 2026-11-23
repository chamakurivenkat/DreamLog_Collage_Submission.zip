@echo off
echo ==================================================
echo 🌙 Starting DreamLog: SnoozeScience Sprint
echo ==================================================

cd /d "%~dp0backend"

if not exist "node_modules\" (
    echo 📦 First time run detected: Installing backend dependencies...
    call npm install
)

echo 🚀 Launching DreamLog Application...
echo 🌐 Opening http://localhost:5001 in your browser...

start http://localhost:5001
node server.js
pause
