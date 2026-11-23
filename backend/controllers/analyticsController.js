const store = require("../config/store");

function calculatePearson(xArr, yArr) {
    const n = Math.min(xArr.length, yArr.length);
    if (n < 2) return null;

    const meanX = xArr.reduce((a, b) => a + b, 0) / n;
    const meanY = yArr.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
        const dx = xArr[i] - meanX;
        const dy = yArr[i] - meanY;
        numerator += dx * dy;
        sumSqX += dx * dx;
        sumSqY += dy * dy;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);
    return denominator === 0 ? 0 : parseFloat((numerator / denominator).toFixed(3));
}

function calculateRegression(xArr, yArr) {
    const n = Math.min(xArr.length, yArr.length);
    if (n < 2) return { slope: 0, intercept: 0 };

    const meanX = xArr.reduce((a, b) => a + b, 0) / n;
    const meanY = yArr.reduce((a, b) => a + b, 0) / n;

    let num = 0;
    let den = 0;

    for (let i = 0; i < n; i++) {
        num += (xArr[i] - meanX) * (yArr[i] - meanY);
        den += Math.pow(xArr[i] - meanX, 2);
    }

    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;

    return {
        slope: parseFloat(slope.toFixed(3)),
        intercept: parseFloat(intercept.toFixed(3))
    };
}

// @desc    Get aggregated analytics & correlations
// @route   GET /api/analytics
exports.getAnalytics = async (req, res) => {
    try {
        const filter = {};
        if (req.user) filter.user = req.user.id || req.user._id;

        const [sleepRecords, studyRecords] = await Promise.all([
            store.getSleep(filter),
            store.getStudy(filter)
        ]);

        const totalSleepLogs = sleepRecords.length;
        const totalStudyLogs = studyRecords.length;

        const avgSleep = totalSleepLogs > 0
            ? parseFloat((sleepRecords.reduce((s, r) => s + r.sleepHours, 0) / totalSleepLogs).toFixed(1))
            : 0;

        const avgStudy = totalStudyLogs > 0
            ? parseFloat((studyRecords.reduce((s, r) => s + r.studyHours, 0) / totalStudyLogs).toFixed(1))
            : 0;

        const avgProductivity = totalStudyLogs > 0
            ? parseFloat((studyRecords.reduce((s, r) => s + r.productivity, 0) / totalStudyLogs).toFixed(1))
            : 0;

        const avgFocus = totalStudyLogs > 0
            ? parseFloat((studyRecords.reduce((s, r) => s + r.focus, 0) / totalStudyLogs).toFixed(1))
            : 0;

        // Sleep debt calculated against 8.0 hrs baseline over last 7 recorded days
        const last7Sleep = sleepRecords.slice(0, 7);
        const baselineTotal = last7Sleep.length * 8.0;
        const actualTotal = last7Sleep.reduce((s, r) => s + r.sleepHours, 0);
        const sleepDebt = parseFloat(Math.max(0, baselineTotal - actualTotal).toFixed(1));

        // Matched dates for Pearson correlation
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

        const sleepValues = paired.map(p => p.sleepHours);
        const prodValues = paired.map(p => p.productivity);

        const correlation = calculatePearson(sleepValues, prodValues);
        const regression = calculateRegression(sleepValues, prodValues);

        res.json({
            summary: {
                avgSleep,
                avgStudy,
                avgProductivity,
                avgFocus,
                sleepDebt,
                totalSleepLogs,
                totalStudyLogs,
                matchedDays: paired.length
            },
            correlation: {
                r: correlation,
                regression,
                pairedData: paired
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Seed 21 illustrative demo records for presentations
// @route   POST /api/seed
exports.seedData = async (req, res) => {
    try {
        const userId = req.user ? (req.user.id || req.user._id) : null;
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
                user: userId,
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
                user: userId,
                date: dateStr,
                subject: subjects[i % subjects.length],
                studyHours,
                focus,
                productivity,
                tasks: Math.round(studyHours * 1.5),
                notes: `Completed sprint review & practice problems.`
            });
        }

        const result = await store.seedRecords(sleeps, studies);
        res.status(201).json({
            message: "Demo records seeded successfully",
            seededDays: 21,
            data: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
