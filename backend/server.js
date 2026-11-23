const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Load .env
require("dotenv").config({ path: path.join(__dirname, ".env") });

const logger = require("./utils/logger");
const { requestLogger, getMonitoringMetrics } = require("./middleware/loggingMiddleware");

const app = express();
let PORT = parseInt(process.env.PORT, 10) || 5001;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, "../frontend")));

// Health & Monitoring endpoints
app.get("/api/health", (req, res) => {
    res.json({
        name: "DreamLog Backend API",
        status: "healthy",
        version: "1.0.0",
        mongoActive: mongoose.connection && mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString()
    });
});

app.get("/api/monitoring", (req, res) => {
    res.json(getMonitoringMetrics());
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/sleep", require("./routes/sleepRoutes"));
app.use("/api/study", require("./routes/studyRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));

// Catch-all route to serve index.html for frontend single-page navigation
app.get("*", (req, res) => {
    if (req.accepts("html")) {
        res.sendFile(path.join(__dirname, "../frontend/index.html"));
    } else {
        res.status(404).json({ error: "Not Found", message: "Requested resource was not found" });
    }
});

// Centralized Error-Handling Middleware
app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`Unhandled Exception on ${req.method} ${req.url}: ${message}`, {
        requestId: req.id,
        stack: err.stack
    });

    res.status(status).json({
        status: "error",
        error: "Server Error",
        requestId: req.id,
        message
    });
});

// Start listening with port retry logic
function listenOnPort(portToTry) {
    const server = app.listen(portToTry, () => {
        logger.info(`DreamLog Server & UI running on port ${portToTry}`);
        console.log(`\n=================================================`);
        console.log(`🌙 DreamLog Server & UI running on port ${portToTry}`);
        console.log(`🌐 Application URL: http://localhost:${portToTry}/`);
        console.log(`📡 Health Check URL: http://localhost:${portToTry}/api/health`);
        console.log(`📊 Monitoring Metrics: http://localhost:${portToTry}/api/monitoring`);
        console.log(`=================================================\n`);
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            logger.warn(`Port ${portToTry} is busy. Trying port ${portToTry + 1}...`);
            listenOnPort(portToTry + 1);
        } else {
            logger.error("Server startup error", { error: err.message });
        }
    });

    return server;
}

// Database Connection & Boot (only when executed directly)
if (require.main === module) {
    const boot = async () => {
        if (process.env.MONGO_URI) {
            try {
                await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2500 });
                logger.info("MongoDB Connected successfully");
            } catch (err) {
                logger.warn("MongoDB offline. Operating in robust local JSON store mode (backend/data/store.json).");
            }
        }
        listenOnPort(PORT);
    };

    boot();
}

module.exports = app;
