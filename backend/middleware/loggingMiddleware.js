const logger = require("../utils/logger");

// Global in-memory metrics tracker
const metrics = {
    startTime: Date.now(),
    totalRequests: 0,
    statusCodes: {
        "2xx": 0,
        "3xx": 0,
        "4xx": 0,
        "5xx": 0
    },
    totalResponseTimeMs: 0,
    endpointHits: {},
    errorsCount: 0
};

const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);

    metrics.totalRequests++;

    const endpointKey = `${req.method} ${req.baseUrl || req.path}`;
    metrics.endpointHits[endpointKey] = (metrics.endpointHits[endpointKey] || 0) + 1;

    // Log response on completion
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        metrics.totalResponseTimeMs += duration;

        const statusCategory = `${Math.floor(res.statusCode / 100)}xx`;
        if (metrics.statusCodes[statusCategory] !== undefined) {
            metrics.statusCodes[statusCategory]++;
        }

        const logMeta = {
            requestId,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip || req.connection.remoteAddress
        };

        if (res.statusCode >= 500) {
            metrics.errorsCount++;
            logger.error(`HTTP ${req.method} ${req.originalUrl} failed`, logMeta);
        } else if (res.statusCode >= 400) {
            logger.warn(`HTTP ${req.method} ${req.originalUrl} client warning`, logMeta);
        } else {
            logger.info(`HTTP ${req.method} ${req.originalUrl}`, logMeta);
        }
    });

    next();
};

const getMonitoringMetrics = () => {
    const uptimeSeconds = Math.floor((Date.now() - metrics.startTime) / 1000);
    const avgResponseTime = metrics.totalRequests > 0
        ? parseFloat((metrics.totalResponseTimeMs / metrics.totalRequests).toFixed(2))
        : 0;

    const memory = process.memoryUsage();

    return {
        server: {
            status: "healthy",
            uptimeSeconds,
            uptimeFormatted: formatUptime(uptimeSeconds),
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            platform: process.platform,
            pid: process.pid
        },
        memoryUsage: {
            heapUsedMB: parseFloat((memory.heapUsed / 1024 / 1024).toFixed(2)),
            heapTotalMB: parseFloat((memory.heapTotal / 1024 / 1024).toFixed(2)),
            rssMB: parseFloat((memory.rss / 1024 / 1024).toFixed(2))
        },
        trafficMetrics: {
            totalRequests: metrics.totalRequests,
            averageResponseTimeMs: avgResponseTime,
            statusBreakdown: metrics.statusCodes,
            endpointUsage: metrics.endpointHits,
            totalErrors: metrics.errorsCount
        }
    };
};

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

module.exports = {
    requestLogger,
    getMonitoringMetrics
};
