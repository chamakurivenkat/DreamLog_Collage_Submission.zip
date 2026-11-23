# 🌙 DreamLog – SnoozeScience Sprint
### Full-Stack Student Sleep & Academic Productivity Web Platform

DreamLog is an end-to-end full-stack web application designed for students and academic researchers to measure, analyze, and optimize sleep hygiene and academic productivity. It demonstrates how sleep duration, sleep quality, and circadian rhythms directly correlate with cognitive focus and daily output.

---

## 🏗️ 1. Complete Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                   Frontend Application                 │
│  HTML5 · CSS3 · Vanilla JavaScript · Chart.js (CDN)    │
│  - 📊 Live Aggregated Dashboard Cards                 │
│  - 🌙 Sleep Tracker (Cross-midnight calculator)        │
│  - 📚 Study Session Productivity Tracker               │
│  - 📈 Weekly Comparison & Pearson r Scatter Chart      │
│  - 💡 Evidence-Based Smart Insights Engine             │
│  - 📅 Exam Week Protected Sleep Schedule Generator     │
│  - 🖨️ Printable Student Wellness Report               │
│  - 👤 JWT Authentication Modal & Toast Notifications   │
└───────────────────────────┬────────────────────────────┘
                            │ REST API (JSON / Bearer Token)
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Backend Architecture                │
│  Node.js · Express.js (MVC Pattern)                    │
│  - 🛡️ Strict Server-Side Input Validation Pipeline    │
│  - 📝 Structured JSON Logging & Request ID Tracing     │
│  - 📊 Real-Time Server Monitoring (/api/monitoring)   │
│  - 🧪 35 Automated Unit & Integration Tests (Passing) │
│  - 🔐 Authentication Service (`/api/auth`) with JWT    │
│  - 🌙 Sleep Tracker CRUD (`/api/sleep`)                │
│  - 📚 Study Session CRUD (`/api/study`)                │
│  - 🔬 Analytics Engine with Pearson r & Regression     │
│  - ⚡ 21-Day Realistic Demo Seeder                     │
│  - 🛡️ macOS AirPlay Port Conflict Tolerant (Port 5001) │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM / Dual Storage
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Database Layer                       │
│  MongoDB / MongoDB Atlas / Local Store Fallback        │
│  - User Accounts Collection                            │
│  - Sleep Logs Collection                               │
│  - Study Sessions Collection                           │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 2. Quick Execution Guide

### Option 1: Run with Automated Tests First
```bash
npm test
```
*Executes all 35 unit and API integration tests in ~300ms.*

### Option 2: Run Server & Launch Application
```bash
npm start
```
*The server starts on port `5001` (avoiding macOS port `5000` AirPlay conflicts) and automatically connects to MongoDB or falls back to local data store if MongoDB is offline.*

Open **`http://localhost:5001`** in any browser.

---

## 📊 3. Observability & Monitoring

- **Live UI & Application:** [http://localhost:5001/](http://localhost:5001/)
- **Health Check Endpoint:** [http://localhost:5001/api/health](http://localhost:5001/api/health)
- **Monitoring & Telemetry:** [http://localhost:5001/api/monitoring](http://localhost:5001/api/monitoring) (returns real-time server uptime, memory usage in MB, traffic count, status code distribution, and average latency).
- **Log Files:** Persistent structured JSON logs recorded in `backend/logs/app.log` and `backend/logs/error.log`.
