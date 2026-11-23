const { describe, it } = require("node:test");
const assert = require("node:assert");

// Helper implementations for isolated mathematical unit tests
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

function calculatePearson(xArr, yArr) {
    const n = Math.min(xArr.length, yArr.length);
    if (n < 2) return null;
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
    return den === 0 ? 0 : parseFloat((num / den).toFixed(3));
}

function calculateRegression(xArr, yArr) {
    const n = Math.min(xArr.length, yArr.length);
    if (n < 2) return { slope: 0, intercept: 0 };
    const meanX = xArr.reduce((a, b) => a + b, 0) / n;
    const meanY = yArr.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
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

describe("Mathematical & Algorithm Unit Tests", () => {
    describe("Cross-Midnight Duration Calculation", () => {
        it("should calculate sleep duration crossing midnight (23:00 to 07:00)", () => {
            const hours = calculateDuration("23:00", "07:00");
            assert.strictEqual(hours, 8.0);
        });

        it("should calculate sleep duration within the same day (13:00 to 15:30)", () => {
            const hours = calculateDuration("13:00", "15:30");
            assert.strictEqual(hours, 2.5);
        });

        it("should handle post-midnight bedtime (01:15 to 08:45)", () => {
            const hours = calculateDuration("01:15", "08:45");
            assert.strictEqual(hours, 7.5);
        });

        it("should handle 24-hour wrap-around edge case (23:45 to 07:15)", () => {
            const hours = calculateDuration("23:45", "07:15");
            assert.strictEqual(hours, 7.5);
        });
    });

    describe("Pearson Correlation Coefficient (r)", () => {
        it("should return +1.0 for a perfect linear positive relationship", () => {
            const x = [5, 6, 7, 8, 9];
            const y = [5, 6, 7, 8, 9];
            const r = calculatePearson(x, y);
            assert.strictEqual(r, 1.0);
        });

        it("should return -1.0 for a perfect linear negative relationship", () => {
            const x = [1, 2, 3, 4, 5];
            const y = [10, 8, 6, 4, 2];
            const r = calculatePearson(x, y);
            assert.strictEqual(r, -1.0);
        });

        it("should return null for datasets with fewer than 2 pairs", () => {
            const x = [8];
            const y = [9];
            const r = calculatePearson(x, y);
            assert.strictEqual(r, null);
        });

        it("should handle realistic student sleep & productivity correlation", () => {
            const sleeps = [5.5, 6.0, 7.5, 8.0, 8.5];
            const prods = [4.0, 5.0, 8.0, 8.5, 9.5];
            const r = calculatePearson(sleeps, prods);
            assert.ok(r > 0.8, "Expected strong positive correlation > 0.8");
        });
    });

    describe("Ordinary Least Squares (OLS) Linear Regression", () => {
        it("should calculate exact slope and intercept for y = 2x + 1", () => {
            const x = [1, 2, 3, 4, 5];
            const y = [3, 5, 7, 9, 11];
            const { slope, intercept } = calculateRegression(x, y);
            assert.strictEqual(slope, 2.0);
            assert.strictEqual(intercept, 1.0);
        });

        it("should handle zero-variance or empty datasets gracefully", () => {
            const { slope, intercept } = calculateRegression([], []);
            assert.strictEqual(slope, 0);
            assert.strictEqual(intercept, 0);
        });
    });
});
