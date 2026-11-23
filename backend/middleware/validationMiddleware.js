// Server-Side Input Validation Middleware for DreamLog

const isValidDate = (dateStr) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && (date.getMonth() + 1) === month && date.getDate() === day;
};

const isValidTime = (timeStr) => {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
};

const isValidEmail = (emailStr) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
};

// Validation for Sleep Record POST / PUT
const validateSleep = (req, res, next) => {
    const errors = [];
    const { date, bedtime, wakeTime, sleepHours, quality, notes } = req.body;

    if (!date) {
        errors.push({ field: "date", message: "Date is required" });
    } else if (!isValidDate(date)) {
        errors.push({ field: "date", message: "Date must be a valid date in YYYY-MM-DD format" });
    }

    if (!bedtime) {
        errors.push({ field: "bedtime", message: "Bedtime is required" });
    } else if (!isValidTime(bedtime)) {
        errors.push({ field: "bedtime", message: "Bedtime must be in 24-hour HH:mm format (e.g. 23:00)" });
    }

    if (!wakeTime) {
        errors.push({ field: "wakeTime", message: "Wake time is required" });
    } else if (!isValidTime(wakeTime)) {
        errors.push({ field: "wakeTime", message: "Wake time must be in 24-hour HH:mm format (e.g. 07:30)" });
    }

    if (sleepHours !== undefined) {
        const hours = Number(sleepHours);
        if (isNaN(hours) || hours < 0 || hours > 24) {
            errors.push({ field: "sleepHours", message: "Sleep duration must be a number between 0 and 24 hours" });
        }
    }

    if (quality !== undefined) {
        const q = Number(quality);
        if (!Number.isInteger(q) || q < 1 || q > 5) {
            errors.push({ field: "quality", message: "Quality rating must be an integer between 1 and 5" });
        }
    }

    if (notes !== undefined && typeof notes === "string" && notes.length > 500) {
        errors.push({ field: "notes", message: "Notes cannot exceed 500 characters" });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: "error",
            error: "Validation Error",
            message: "Invalid sleep session data provided",
            errors
        });
    }

    next();
};

// Validation for Study Record POST / PUT
const validateStudy = (req, res, next) => {
    const errors = [];
    const { date, subject, studyHours, focus, productivity, tasks, notes } = req.body;

    if (!date) {
        errors.push({ field: "date", message: "Date is required" });
    } else if (!isValidDate(date)) {
        errors.push({ field: "date", message: "Date must be a valid date in YYYY-MM-DD format" });
    }

    if (studyHours === undefined || studyHours === null || studyHours === "") {
        errors.push({ field: "studyHours", message: "Study hours are required" });
    } else {
        const hours = Number(studyHours);
        if (isNaN(hours) || hours <= 0 || hours > 24) {
            errors.push({ field: "studyHours", message: "Study hours must be a number between 0.1 and 24 hours" });
        }
    }

    if (focus === undefined || focus === null) {
        errors.push({ field: "focus", message: "Focus level is required" });
    } else {
        const f = Number(focus);
        if (!Number.isInteger(f) || f < 1 || f > 5) {
            errors.push({ field: "focus", message: "Focus level must be an integer between 1 and 5" });
        }
    }

    if (productivity === undefined || productivity === null) {
        errors.push({ field: "productivity", message: "Productivity rating is required" });
    } else {
        const p = Number(productivity);
        if (!Number.isInteger(p) || p < 1 || p > 10) {
            errors.push({ field: "productivity", message: "Productivity rating must be an integer between 1 and 10" });
        }
    }

    if (subject !== undefined && typeof subject === "string" && subject.length > 100) {
        errors.push({ field: "subject", message: "Subject name cannot exceed 100 characters" });
    }

    if (tasks !== undefined) {
        const t = Number(tasks);
        if (isNaN(t) || t < 0) {
            errors.push({ field: "tasks", message: "Completed tasks must be a non-negative number" });
        }
    }

    if (notes !== undefined && typeof notes === "string" && notes.length > 500) {
        errors.push({ field: "notes", message: "Notes cannot exceed 500 characters" });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: "error",
            error: "Validation Error",
            message: "Invalid study session data provided",
            errors
        });
    }

    next();
};

// Validation for User Registration
const validateRegister = (req, res, next) => {
    const errors = [];
    const { name, email, password } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
        errors.push({ field: "name", message: "Name must be at least 2 characters long" });
    } else if (name.trim().length > 50) {
        errors.push({ field: "name", message: "Name cannot exceed 50 characters" });
    }

    if (!email) {
        errors.push({ field: "email", message: "Email is required" });
    } else if (!isValidEmail(email)) {
        errors.push({ field: "email", message: "Please provide a valid email address" });
    }

    if (!password) {
        errors.push({ field: "password", message: "Password is required" });
    } else if (typeof password !== "string" || password.length < 6) {
        errors.push({ field: "password", message: "Password must be at least 6 characters long" });
    } else if (password.length > 100) {
        errors.push({ field: "password", message: "Password cannot exceed 100 characters" });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: "error",
            error: "Validation Error",
            message: "Invalid registration data",
            errors
        });
    }

    next();
};

// Validation for User Login
const validateLogin = (req, res, next) => {
    const errors = [];
    const { email, password } = req.body;

    if (!email) {
        errors.push({ field: "email", message: "Email is required" });
    } else if (!isValidEmail(email)) {
        errors.push({ field: "email", message: "Please provide a valid email address" });
    }

    if (!password) {
        errors.push({ field: "password", message: "Password is required" });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: "error",
            error: "Validation Error",
            message: "Invalid login credentials",
            errors
        });
    }

    next();
};

module.exports = {
    validateSleep,
    validateStudy,
    validateRegister,
    validateLogin,
    isValidDate,
    isValidTime,
    isValidEmail
};
