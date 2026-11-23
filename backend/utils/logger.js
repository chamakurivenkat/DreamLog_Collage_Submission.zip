const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../logs");
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const APP_LOG_FILE = path.join(LOG_DIR, "app.log");
const ERROR_LOG_FILE = path.join(LOG_DIR, "error.log");

const writeToFile = (filePath, message) => {
    try {
        fs.appendFileSync(filePath, message + "\n", "utf-8");
    } catch (e) {
        // fail silently to prevent crashing
    }
};

const formatLog = (level, message, meta = {}) => {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
    });
};

const logger = {
    info(message, meta = {}) {
        const line = formatLog("INFO", message, meta);
        console.log(`\x1b[36m[INFO]\x1b[0m ${message}`, Object.keys(meta).length ? meta : "");
        writeToFile(APP_LOG_FILE, line);
    },

    warn(message, meta = {}) {
        const line = formatLog("WARN", message, meta);
        console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`, Object.keys(meta).length ? meta : "");
        writeToFile(APP_LOG_FILE, line);
    },

    error(message, meta = {}) {
        const line = formatLog("ERROR", message, meta);
        console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, Object.keys(meta).length ? meta : "");
        writeToFile(APP_LOG_FILE, line);
        writeToFile(ERROR_LOG_FILE, line);
    },

    debug(message, meta = {}) {
        if (process.env.NODE_ENV === "development") {
            const line = formatLog("DEBUG", message, meta);
            console.log(`\x1b[90m[DEBUG]\x1b[0m ${message}`, meta);
            writeToFile(APP_LOG_FILE, line);
        }
    }
};

module.exports = logger;
