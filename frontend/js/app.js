// DreamLog Application Core - SnoozeScience Sprint
// Architecture: Vanilla JS + REST APIs + LocalStorage Fallback + Chart.js

let API_URL = "http://localhost:5001/api";
let backendOnline = false;
let authToken = localStorage.getItem("dreamlog_token") || null;
let currentUser = null;

// Chart Instances
let weeklyChart = null;
let scatterChart = null;

// Toast Notification Manager
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Automatically detect running backend API URL
async function detectBackend() {
    const statusPill = document.getElementById("backendStatus");
    const candidates = [];

    if (window.location.origin && window.location.origin.startsWith("http")) {
        candidates.push({ base: window.location.origin, label: window.location.port || "Origin" });
    }
    candidates.push({ base: "http://localhost:5001", label: "5001" });
    candidates.push({ base: "http://localhost:5000", label: "5000" });

    for (const c of candidates) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);
            const res = await fetch(`${c.base}/api/health`, { method: "GET", signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                API_URL = `${c.base}/api`;
                backendOnline = true;
                if (statusPill) {
                    statusPill.className = "status-pill status-online";
                    statusPill.innerHTML = `<span class="status-dot"></span> Backend Active (${c.label})`;
                }
                return true;
            }
        } catch (e) {
            // try next candidate
        }
    }

    backendOnline = false;
    if (statusPill) {
        statusPill.className = "status-pill status-offline";
        statusPill.innerHTML = `<span class="status-dot"></span> Client Local Mode`;
    }
    return false;
}

// Calculate Sleep Duration (handles crossing midnight)
function calculateDuration(bedtime, wakeTime) {
    if (!bedtime || !wakeTime) return 0;
    const [bH, bM] = bedtime.split(":").map(Number);
    const [wH, wM] = wakeTime.split(":").map(Number);

    let bedMinutes = bH * 60 + bM;
    let wakeMinutes = wH * 60 + wM;

    if (wakeMinutes <= bedMinutes) {
        wakeMinutes += 24 * 60;
    }

    return parseFloat(((wakeMinutes - bedMinutes) / 60).toFixed(1));
}

// LocalStorage Persistence Helpers (Fail-Proof Fallback)
function getLocalSleeps() {
    try {
        const raw = localStorage.getItem("dreamlog_sleeps");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setLocalSleeps(records) {
    localStorage.setItem("dreamlog_sleeps", JSON.stringify(records));
}

function getLocalStudies() {
    try {
        const raw = localStorage.getItem("dreamlog_studies");
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setLocalStudies(records) {
    localStorage.setItem("dreamlog_studies", JSON.stringify(records));
}

// Client-side Analytics Computer (if backend is offline)
function computeLocalAnalytics(sleepRecords, studyRecords) {
    const totalSleepLogs = sleepRecords.length;
    const totalStudyLogs = studyRecords.length;

    const avgSleep = totalSleepLogs > 0
        ? parseFloat((sleepRecords.reduce((s, r) => s + (r.sleepHours || 0), 0) / totalSleepLogs).toFixed(1))
        : 0;

    const avgStudy = totalStudyLogs > 0
        ? parseFloat((studyRecords.reduce((s, r) => s + (r.studyHours || 0), 0) / totalStudyLogs).toFixed(1))
        : 0;

    const avgProductivity = totalStudyLogs > 0
        ? parseFloat((studyRecords.reduce((s, r) => s + (r.productivity || 0), 0) / totalStudyLogs).toFixed(1))
        : 0;

    const avgFocus = totalStudyLogs > 0
        ? parseFloat((studyRecords.reduce((s, r) => s + (r.focus || 0), 0) / totalStudyLogs).toFixed(1))
        : 0;

    const last7Sleep = sleepRecords.slice(0, 7);
    const baselineTotal = last7Sleep.length * 8.0;
    const actualTotal = last7Sleep.reduce((s, r) => s + (r.sleepHours || 0), 0);
    const sleepDebt = parseFloat(Math.max(0, baselineTotal - actualTotal).toFixed(1));

    // Match days
    const sleepMap = new Map(sleepRecords.map(r => [r.date, r]));
    const paired = [];

    studyRecords.forEach(study => {
        const sleep = sleepMap.get(study.date);
        if (sleep) {
            paired.push({
                date: study.date,
                sleepHours: sleep.sleepHours,
                quality: sleep.quality || 3,
                studyHours: study.studyHours,
                productivity: study.productivity,
                focus: study.focus
            });
        }
    });

    const xArr = paired.map(p => p.sleepHours);
    const yArr = paired.map(p => p.productivity);
    const n = paired.length;

    let r = null;
    let slope = 0;
    let intercept = 0;

    if (n >= 2) {
        const meanX = xArr.reduce((a, b) => a + b, 0) / n;
        const meanY = yArr.reduce((a, b) => a + b, 0) / n;
        let num = 0, sumSqX = 0, sumSqY = 0;
        for (let i = 0; i < n; i++) {
            const dx = xArr[i] - meanX;
            const dy = yArr[i] - meanY;
            num += dx * dy;
            sumSqX += dx * dx;
            sumSqY += dy * dy;
        }
        const den = Math.sqrt(sumSqX * sumSqY);
        r = den === 0 ? 0 : parseFloat((num / den).toFixed(3));
        slope = sumSqX === 0 ? 0 : parseFloat((num / sumSqX).toFixed(3));
        intercept = parseFloat((meanY - slope * meanX).toFixed(3));
    }

    return {
        summary: {
            avgSleep,
            avgStudy,
            avgProductivity,
            avgFocus,
            sleepDebt,
            totalSleepLogs,
            totalStudyLogs,
            matchedDays: n
        },
        correlation: {
            r,
            regression: { slope, intercept },
            pairedData: paired
        }
    };
}

// 21-Day Realistic Demo Generator
function generate21DemoDays() {
    const sleeps = [];
    const studies = [];
    const subjects = ["Algorithms & Data Structures", "Database Systems", "Operating Systems", "Linear Algebra", "Web Development"];
    const baseSleeps = [5.5, 6.2, 7.5, 6.0, 8.2, 7.8, 5.8, 8.5, 7.0, 7.8, 5.2, 8.0, 7.4, 6.4, 8.5, 7.9, 6.8, 6.0, 8.3, 7.5, 8.2];

    for (let i = 20; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];

        const hours = baseSleeps[20 - i];
        const bedHour = i % 3 === 0 ? 0 : 23;
        const bedMin = i % 2 === 0 ? 30 : 0;
        const bedtime = `${String(bedHour).padStart(2, "0")}:${String(bedMin).padStart(2, "0")}`;

        const wakeMinsTotal = (bedHour * 60 + bedMin) + Math.round(hours * 60);
        const wakeHour = Math.floor(wakeMinsTotal / 60) % 24;
        const wakeMin = wakeMinsTotal % 60;
        const wakeTime = `${String(wakeHour).padStart(2, "0")}:${String(wakeMin).padStart(2, "0")}`;

        const quality = Math.min(5, Math.max(1, Math.round(hours / 1.7)));

        sleeps.push({
            _id: `seed_s_${i}`,
            date: dateStr,
            bedtime,
            wakeTime,
            sleepHours: hours,
            quality,
            notes: hours >= 7 ? "Felt rested and energetic" : "Mild fatigue, woke up groggy"
        });

        const studyHours = parseFloat((2.5 + (i % 4) * 0.8).toFixed(1));
        const focus = Math.min(5, Math.max(1, Math.round(1.0 + hours * 0.45)));
        const productivity = Math.min(10, Math.max(2, Math.round(hours * 1.05 + focus * 0.3)));

        studies.push({
            _id: `seed_st_${i}`,
            date: dateStr,
            subject: subjects[i % subjects.length],
            studyHours,
            focus,
            productivity,
            tasks: Math.round(studyHours * 1.5),
            notes: `Completed sprint review & practice problems.`
        });
    }

    return { sleeps, studies };
}

// API Helper with Authentication Headers
async function apiRequest(endpoint, method = "GET", body = null) {
    const headers = { "Content-Type": "application/json" };
    if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    return data;
}

// --- Sleep Operations ---
async function saveSleepRecord(payload) {
    if (backendOnline) {
        try {
            const result = await apiRequest("/sleep", "POST", payload);
            showToast("Sleep record saved to database!", "success");
            return result.data;
        } catch (err) {
            console.warn("Backend error, storing locally:", err.message);
        }
    }

    // LocalStorage Fallback
    const local = getLocalSleeps();
    const newRecord = {
        _id: `sleep_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString()
    };
    local.unshift(newRecord);
    setLocalSleeps(local);
    showToast("Sleep record saved successfully!", "success");
    return newRecord;
}

async function fetchSleepRecords() {
    if (backendOnline) {
        try {
            const data = await apiRequest("/sleep", "GET");
            if (Array.isArray(data) && data.length > 0) return data;
        } catch (e) {
            console.warn("API sleep fetch failed, using local store:", e.message);
        }
    }

    let local = getLocalSleeps();
    if (local.length === 0) {
        const demo = generate21DemoDays();
        setLocalSleeps(demo.sleeps);
        setLocalStudies(demo.studies);
        local = demo.sleeps;
    }
    return local;
}

async function deleteSleepRecord(id) {
    if (!confirm("Are you sure you want to delete this sleep log?")) return;
    if (backendOnline) {
        try {
            await apiRequest(`/sleep/${id}`, "DELETE");
            showToast("Sleep record deleted from database", "info");
            await refreshAllData();
            return;
        } catch (err) {
            console.warn("API delete failed, updating local store");
        }
    }

    let local = getLocalSleeps();
    local = local.filter(r => (r._id || r.id) !== id);
    setLocalSleeps(local);
    showToast("Sleep record deleted", "info");
    await refreshAllData();
}

// --- Study Operations ---
async function saveStudyRecord(payload) {
    if (backendOnline) {
        try {
            const result = await apiRequest("/study", "POST", payload);
            showToast("Study session saved to database!", "success");
            return result.data;
        } catch (err) {
            console.warn("Backend error, storing locally:", err.message);
        }
    }

    // LocalStorage Fallback
    const local = getLocalStudies();
    const newRecord = {
        _id: `study_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString()
    };
    local.unshift(newRecord);
    setLocalStudies(local);
    showToast("Study session saved successfully!", "success");
    return newRecord;
}

async function fetchStudyRecords() {
    if (backendOnline) {
        try {
            const data = await apiRequest("/study", "GET");
            if (Array.isArray(data) && data.length > 0) return data;
        } catch (e) {
            console.warn("API study fetch failed, using local store:", e.message);
        }
    }

    let local = getLocalStudies();
    if (local.length === 0) {
        const demo = generate21DemoDays();
        setLocalSleeps(demo.sleeps);
        setLocalStudies(demo.studies);
        local = demo.studies;
    }
    return local;
}

async function deleteStudyRecord(id) {
    if (!confirm("Are you sure you want to delete this study log?")) return;
    if (backendOnline) {
        try {
            await apiRequest(`/study/${id}`, "DELETE");
            showToast("Study record deleted from database", "info");
            await refreshAllData();
            return;
        } catch (err) {
            console.warn("API delete failed, updating local store");
        }
    }

    let local = getLocalStudies();
    local = local.filter(r => (r._id || r.id) !== id);
    setLocalStudies(local);
    showToast("Study record deleted", "info");
    await refreshAllData();
}

// --- Analytics Operations ---
async function fetchAnalytics(sleeps, studies) {
    if (backendOnline) {
        try {
            const data = await apiRequest("/analytics", "GET");
            if (data && data.summary) return data;
        } catch (e) {
            console.warn("API analytics failed, computing locally:", e.message);
        }
    }

    return computeLocalAnalytics(sleeps, studies);
}

// --- Dashboard & UI Updates ---
function updateDashboardUI(analytics, sleepRecords, studyRecords) {
    const avgSleepEl = document.getElementById("avgSleep");
    const avgStudyEl = document.getElementById("avgStudy");
    const avgProdEl = document.getElementById("avgProductivity");
    const avgFocusEl = document.getElementById("avgFocus");
    const debtEl = document.getElementById("sleepDebt");
    const pearsonEl = document.getElementById("pearsonDisplay");
    const correlationText = document.getElementById("correlationText");
    const sleepBadge = document.getElementById("sleepStatusBadge");

    if (analytics && analytics.summary) {
        const s = analytics.summary;
        avgSleepEl.textContent = `${s.avgSleep} hrs`;
        avgStudyEl.textContent = `${s.avgStudy} hrs`;
        avgProdEl.textContent = `${s.avgProductivity}/10`;
        avgFocusEl.textContent = `${s.avgFocus}/5`;
        debtEl.textContent = `${s.sleepDebt} hrs`;

        if (s.avgSleep >= 7 && s.avgSleep <= 9) {
            sleepBadge.textContent = "Optimal Range (7-9h)";
            sleepBadge.style.color = "#10b981";
        } else if (s.avgSleep < 7 && s.avgSleep > 0) {
            sleepBadge.textContent = "Sleep Debt Warning";
            sleepBadge.style.color = "#f43f5e";
        } else {
            sleepBadge.textContent = "Awaiting data";
        }

        const r = analytics.correlation ? analytics.correlation.r : null;
        if (r !== null) {
            pearsonEl.textContent = r > 0 ? `+${r}` : `${r}`;
            if (r >= 0.6) correlationText.textContent = "Strong Positive Correlation";
            else if (r >= 0.3) correlationText.textContent = "Moderate Positive Correlation";
            else correlationText.textContent = "Slight / Neutral Correlation";
        } else {
            pearsonEl.textContent = "--";
            correlationText.textContent = "Need ≥ 2 matched days";
        }

        // Update Printable Report
        document.getElementById("repAvgSleep").textContent = `${s.avgSleep} hrs`;
        document.getElementById("repAvgStudy").textContent = `${s.avgStudy} hrs`;
        document.getElementById("repAvgProd").textContent = `${s.avgProductivity}/10`;
        document.getElementById("repSleepDebt").textContent = `${s.sleepDebt} hrs`;
        document.getElementById("repCorrelation").textContent = r !== null ? `r = ${r}` : "N/A";
    }
}

// Render Sleep Table
function renderSleepTable(records = []) {
    const tbody = document.querySelector("#sleepHistoryTable tbody");
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No sleep records found. Use the form to record your first night.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.slice(0, 10).map(r => `
        <tr>
            <td><strong>${r.date}</strong></td>
            <td>${r.bedtime}</td>
            <td>${r.wakeTime}</td>
            <td><strong>${r.sleepHours} hrs</strong></td>
            <td>${"⭐".repeat(r.quality || 3)}</td>
            <td><button class="btn-delete" onclick="deleteSleepRecord('${r._id || r.id}')">Delete</button></td>
        </tr>
    `).join("");
}

// Render Study Table
function renderStudyTable(records = []) {
    const tbody = document.querySelector("#studyHistoryTable tbody");
    if (!tbody) return;

    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No study records found. Log your sessions above.</td></tr>`;
        return;
    }

    tbody.innerHTML = records.slice(0, 10).map(r => `
        <tr>
            <td><strong>${r.date}</strong></td>
            <td>${r.subject || "General"}</td>
            <td><strong>${r.studyHours} hrs</strong></td>
            <td>${r.focus}/5</td>
            <td>${r.productivity}/10</td>
            <td><button class="btn-delete" onclick="deleteStudyRecord('${r._id || r.id}')">Delete</button></td>
        </tr>
    `).join("");
}

// Render Weekly Comparison Chart
function renderWeeklyChart(sleepRecords = [], studyRecords = []) {
    const ctx = document.getElementById("weeklyChart");
    if (!ctx) return;

    const dateSet = new Set([
        ...sleepRecords.map(r => r.date),
        ...studyRecords.map(r => r.date)
    ]);
    const sortedDates = Array.from(dateSet).sort().slice(-7);

    const sleepMap = new Map(sleepRecords.map(r => [r.date, r.sleepHours]));
    const studyMap = new Map(studyRecords.map(r => [r.date, r.studyHours]));

    const sleepData = sortedDates.map(d => sleepMap.get(d) || 0);
    const studyData = sortedDates.map(d => studyMap.get(d) || 0);

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: sortedDates.length ? sortedDates : ["No Data"],
            datasets: [
                {
                    label: "Sleep Duration (hrs)",
                    data: sleepData.length ? sleepData : [0],
                    backgroundColor: "#6366f1",
                    borderRadius: 6
                },
                {
                    label: "Study Duration (hrs)",
                    data: studyData.length ? studyData : [0],
                    backgroundColor: "#a5b4fc",
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 14, title: { display: true, text: "Hours" } }
            }
        }
    });
}

// Render Scatter Plot with Regression Trendline
function renderScatterChart(pairedData = [], regression = { slope: 0, intercept: 0 }) {
    const ctx = document.getElementById("scatterChart");
    if (!ctx) return;

    const scatterPoints = pairedData.map(p => ({
        x: p.sleepHours,
        y: p.productivity
    }));

    const trendlinePoints = [];
    if (pairedData.length >= 2) {
        const xValues = pairedData.map(p => p.sleepHours);
        const minX = Math.max(3, Math.min(...xValues) - 0.5);
        const maxX = Math.min(12, Math.max(...xValues) + 0.5);

        trendlinePoints.push({ x: minX, y: parseFloat((regression.slope * minX + regression.intercept).toFixed(1)) });
        trendlinePoints.push({ x: maxX, y: parseFloat((regression.slope * maxX + regression.intercept).toFixed(1)) });
    }

    if (scatterChart) scatterChart.destroy();

    scatterChart = new Chart(ctx, {
        type: "scatter",
        data: {
            datasets: [
                {
                    label: "Logged Days (Sleep vs Productivity)",
                    data: scatterPoints,
                    backgroundColor: "#5c4eb5",
                    borderColor: "#302e60",
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: `Trendline (y = ${regression.slope}x + ${regression.intercept})`,
                    data: trendlinePoints,
                    type: "line",
                    borderColor: "#f43f5e",
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { min: 4, max: 11, title: { display: true, text: "Sleep Hours (Night Before)" } },
                y: { min: 0, max: 11, title: { display: true, text: "Productivity Rating (1-10)" } }
            }
        }
    });
}

// Generate Insights
function renderInsightsUI(analytics) {
    const insightBox = document.getElementById("insightBox");
    const summaryText = document.getElementById("reportSummaryText");
    if (!insightBox) return;

    if (!analytics || analytics.summary.totalSleepLogs === 0) {
        insightBox.innerHTML = `<strong>No data logged yet.</strong> Click <strong>⚡ Seed Demo Data</strong> in the top bar to immediately populate 21 days of sample student data.`;
        if (summaryText) summaryText.textContent = "Awaiting sufficient student data.";
        return;
    }

    const { summary, correlation } = analytics;
    const items = [];

    if (summary.avgSleep < 7) {
        items.push(`⚠️ <strong>Circadian Deficit:</strong> Your average sleep duration is <strong>${summary.avgSleep} hrs</strong>. Chronic sleep duration below 7 hours impairs prefrontal cortex executive functioning and information retention.`);
    } else {
        items.push(`✅ <strong>Restorative Recovery:</strong> Your average sleep of <strong>${summary.avgSleep} hrs</strong> meets the National Sleep Foundation guidelines for academic learning.`);
    }

    if (summary.sleepDebt > 0) {
        items.push(`⏳ <strong>Accumulated Sleep Debt:</strong> You have accumulated <strong>${summary.sleepDebt} hours</strong> of sleep debt relative to the healthy 8.0-hour student baseline over the last 7 days.`);
    } else {
        items.push(`🌟 <strong>Zero Sleep Debt:</strong> No sleep deficit recorded! You are operating with full cognitive capacity.`);
    }

    if (correlation.r !== null) {
        const direction = correlation.r > 0 ? "positive" : "negative";
        const strength = Math.abs(correlation.r) >= 0.6 ? "strong" : "moderate";
        items.push(`🔬 <strong>Empirical Pearson Correlation:</strong> $r = ${correlation.r}$ indicates a <strong>${strength} ${direction} correlation</strong> between your nightly sleep duration and self-reported productivity rating.`);
    }

    insightBox.innerHTML = items.map(t => `<p style="margin-bottom: 10px;">${t}</p>`).join("");
    if (summaryText) {
        summaryText.innerHTML = items.join("<br><br>");
    }
}

// Exam Week Schedule Generator
function generateExamSchedule() {
    const examsCount = parseInt(document.getElementById("examSubjectsCount").value, 10);
    const wakeTime = document.getElementById("targetWakeTime").value || "07:30";
    const container = document.getElementById("scheduleResults");
    if (!container) return;

    const [wH, wM] = wakeTime.split(":").map(Number);
    let bedMins = (wH * 60 + wM) - (8 * 60);
    if (bedMins < 0) bedMins += 24 * 60;
    const bH = String(Math.floor(bedMins / 60)).padStart(2, "0");
    const bM = String(bedMins % 60).padStart(2, "0");

    const maxStudyHours = Math.min(8.0, parseFloat((examsCount * 1.6).toFixed(1)));

    container.innerHTML = `
        <div class="schedule-card">
            <h4>🌙 Protected Sleep Protocol</h4>
            <div class="schedule-item"><span>Target Bedtime:</span> <strong>${bH}:${bM}</strong></div>
            <div class="schedule-item"><span>Target Wake Up:</span> <strong>${wakeTime}</strong></div>
            <div class="schedule-item"><span>Protected Sleep:</span> <strong>8.0 hrs</strong></div>
            <div class="schedule-item"><span>Cognitive State:</span> <strong style="color: #10b981;">Peak Retention</strong></div>
        </div>
        <div class="schedule-card">
            <h4>📚 Academic Load Strategy</h4>
            <div class="schedule-item"><span>Target Exam Count:</span> <strong>${examsCount} subjects</strong></div>
            <div class="schedule-item"><span>Recommended Study Cap:</span> <strong>${maxStudyHours} hrs/day</strong></div>
            <div class="schedule-item"><span>Pomodoro Intervals:</span> <strong>50 min study / 10 min break</strong></div>
            <div class="schedule-item"><span>Caffeine Curfew:</span> <strong>14:00 (6 hrs prior to bed)</strong></div>
        </div>
    `;
}

// Master Refresh
async function refreshAllData() {
    const [sleeps, studies] = await Promise.all([
        fetchSleepRecords(),
        fetchStudyRecords()
    ]);

    const analytics = await fetchAnalytics(sleeps, studies);

    renderSleepTable(sleeps);
    renderStudyTable(studies);
    updateDashboardUI(analytics, sleeps, studies);
    renderWeeklyChart(sleeps, studies);

    if (analytics && analytics.correlation) {
        renderScatterChart(analytics.correlation.pairedData, analytics.correlation.regression);
    }
    renderInsightsUI(analytics);
}

// --- User Authentication Handlers ---
function updateAuthUI() {
    const openBtn = document.getElementById("openAuthModalBtn");
    const userProfile = document.getElementById("userProfile");
    const nameDisplay = document.getElementById("userNameDisplay");

    if (authToken && currentUser) {
        if (openBtn) openBtn.classList.add("hidden");
        if (userProfile) userProfile.classList.remove("hidden");
        if (nameDisplay) nameDisplay.textContent = `👤 ${currentUser.name}`;
    } else {
        if (openBtn) openBtn.classList.remove("hidden");
        if (userProfile) userProfile.classList.add("hidden");
    }
}

async function checkAuthSession() {
    if (!authToken || !backendOnline) return;
    try {
        const data = await apiRequest("/auth/profile");
        currentUser = data.user;
        updateAuthUI();
    } catch (e) {
        authToken = null;
        currentUser = null;
        localStorage.removeItem("dreamlog_token");
        updateAuthUI();
    }
}

// --- DOM Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Detect backend connection
    await detectBackend();

    // 2. Set default date inputs to today
    const today = new Date().toISOString().split("T")[0];
    const sDate = document.getElementById("sleepDate");
    const stDate = document.getElementById("studyDate");
    if (sDate) sDate.value = today;
    if (stDate) stDate.value = today;

    // 3. Live Duration preview on time change
    const bedtimeInput = document.getElementById("bedtime");
    const wakeTimeInput = document.getElementById("wakeTime");
    const durationLabel = document.getElementById("calculatedSleepDuration");

    function updateLiveDuration() {
        if (bedtimeInput && wakeTimeInput && durationLabel) {
            const h = calculateDuration(bedtimeInput.value, wakeTimeInput.value);
            durationLabel.textContent = `${h} hrs`;
        }
    }
    if (bedtimeInput) bedtimeInput.addEventListener("input", updateLiveDuration);
    if (wakeTimeInput) wakeTimeInput.addEventListener("input", updateLiveDuration);

    // 4. Sleep Form Submission
    const sleepForm = document.getElementById("sleepForm");
    if (sleepForm) {
        sleepForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const date = sDate.value;
            const bedtime = bedtimeInput.value;
            const wakeTime = wakeTimeInput.value;
            const sleepHours = calculateDuration(bedtime, wakeTime);
            const quality = parseInt(document.getElementById("sleepQuality").value, 10);
            const notes = document.getElementById("sleepNotes").value;

            const res = await saveSleepRecord({ date, bedtime, wakeTime, sleepHours, quality, notes });
            if (res) {
                sleepForm.reset();
                if (sDate) sDate.value = today;
                if (bedtimeInput) bedtimeInput.value = "23:00";
                if (wakeTimeInput) wakeTimeInput.value = "07:00";
                updateLiveDuration();
                await refreshAllData();
            }
        });
    }

    // 5. Study Form Submission
    const studyForm = document.getElementById("studyForm");
    if (studyForm) {
        studyForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const date = stDate.value;
            const subject = document.getElementById("studySubject").value;
            const studyHours = parseFloat(document.getElementById("studyHours").value);
            const focus = parseInt(document.getElementById("focus").value, 10);
            const productivity = parseInt(document.getElementById("score").value, 10);
            const notes = document.getElementById("studyNotes").value;

            const res = await saveStudyRecord({ date, subject, studyHours, focus, productivity, notes });
            if (res) {
                studyForm.reset();
                if (stDate) stDate.value = today;
                document.getElementById("scoreVal").textContent = "8";
                await refreshAllData();
            }
        });
    }

    // 6. Seed Demo Data Button
    const seedBtn = document.getElementById("seedBtn");
    if (seedBtn) {
        seedBtn.addEventListener("click", async () => {
            try {
                seedBtn.disabled = true;
                seedBtn.textContent = "Seeding...";

                if (backendOnline) {
                    await apiRequest("/analytics/seed", "POST");
                } else {
                    const demo = generate21DemoDays();
                    setLocalSleeps(demo.sleeps);
                    setLocalStudies(demo.studies);
                }

                showToast("21 Days of realistic SnoozeScience data loaded!", "success");
                await refreshAllData();
            } catch (err) {
                showToast(err.message, "error");
            } finally {
                seedBtn.disabled = false;
                seedBtn.textContent = "⚡ Seed Demo Data";
            }
        });
    }

    // 7. Exam Schedule Button
    const examBtn = document.getElementById("generateScheduleBtn");
    if (examBtn) {
        examBtn.addEventListener("click", () => {
            generateExamSchedule();
            showToast("Balanced Exam Schedule generated!", "info");
        });
        generateExamSchedule(); // pre-populate default
    }

    // 8. Printable Wellness Report Button
    const printReportBtn = document.getElementById("printReportBtn");
    if (printReportBtn) {
        printReportBtn.addEventListener("click", () => {
            const report = document.getElementById("report");
            if (report) {
                report.scrollIntoView({ behavior: "smooth" });
            }
            setTimeout(() => window.print(), 500);
        });
    }

    // 9. Sidebar Navigation Active Class Tracking
    const navItems = document.querySelectorAll(".sidebar .nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(n => n.classList.remove("active"));
            item.classList.add("active");
        });
    });

    // 10. Auth Modal Logic
    const authModal = document.getElementById("authModal");
    const openAuthBtn = document.getElementById("openAuthModalBtn");
    const closeAuthBtn = document.getElementById("closeAuthModal");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const logoutBtn = document.getElementById("logoutBtn");

    if (openAuthBtn) openAuthBtn.addEventListener("click", () => authModal.classList.remove("hidden"));
    if (closeAuthBtn) closeAuthBtn.addEventListener("click", () => authModal.classList.add("hidden"));

    if (tabLogin && tabRegister) {
        tabLogin.addEventListener("click", () => {
            tabLogin.classList.add("active");
            tabRegister.classList.remove("active");
            loginForm.classList.remove("hidden");
            registerForm.classList.add("hidden");
        });

        tabRegister.addEventListener("click", () => {
            tabRegister.classList.add("active");
            tabLogin.classList.remove("active");
            registerForm.classList.remove("hidden");
            loginForm.classList.add("hidden");
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            try {
                const res = await apiRequest("/auth/login", "POST", { email, password });
                authToken = res.token;
                currentUser = res.user;
                localStorage.setItem("dreamlog_token", authToken);
                updateAuthUI();
                authModal.classList.add("hidden");
                showToast(`Welcome back, ${currentUser.name}!`, "success");
                await refreshAllData();
            } catch (err) {
                showToast(err.message, "error");
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("regName").value;
            const email = document.getElementById("regEmail").value;
            const password = document.getElementById("regPassword").value;
            try {
                const res = await apiRequest("/auth/register", "POST", { name, email, password });
                authToken = res.token;
                currentUser = res.user;
                localStorage.setItem("dreamlog_token", authToken);
                updateAuthUI();
                authModal.classList.add("hidden");
                showToast(`Account created! Welcome, ${currentUser.name}!`, "success");
                await refreshAllData();
            } catch (err) {
                showToast(err.message, "error");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            authToken = null;
            currentUser = null;
            localStorage.removeItem("dreamlog_token");
            updateAuthUI();
            showToast("Logged out successfully", "info");
            refreshAllData();
        });
    }

    // 11. Check existing session and load initial data
    await checkAuthSession();
    await refreshAllData();
});
