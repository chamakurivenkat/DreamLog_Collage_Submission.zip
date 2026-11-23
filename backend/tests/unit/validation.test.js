const { describe, it } = require("node:test");
const assert = require("node:assert");
const {
    isValidDate,
    isValidTime,
    isValidEmail,
    validateSleep,
    validateStudy,
    validateRegister
} = require("../../middleware/validationMiddleware");

describe("Input Validation Unit Tests", () => {
    describe("Date Format & Calendar Validator (isValidDate)", () => {
        it("should accept valid dates in YYYY-MM-DD format", () => {
            assert.strictEqual(isValidDate("2026-11-20"), true);
            assert.strictEqual(isValidDate("2024-02-29"), true); // leap year
        });

        it("should reject non-existent calendar dates", () => {
            assert.strictEqual(isValidDate("2026-02-30"), false); // Feb 30 does not exist
            assert.strictEqual(isValidDate("2026-04-31"), false); // April has 30 days
        });

        it("should reject malformed or non-ISO dates", () => {
            assert.strictEqual(isValidDate("20-11-2026"), false);
            assert.strictEqual(isValidDate("11/20/2026"), false);
            assert.strictEqual(isValidDate("invalid-date"), false);
        });
    });

    describe("Time Format Validator (isValidTime)", () => {
        it("should accept valid 24-hour HH:mm times", () => {
            assert.strictEqual(isValidTime("00:00"), true);
            assert.strictEqual(isValidTime("07:30"), true);
            assert.strictEqual(isValidTime("23:59"), true);
        });

        it("should reject invalid hours or minutes", () => {
            assert.strictEqual(isValidTime("24:00"), false);
            assert.strictEqual(isValidTime("12:60"), false);
            assert.strictEqual(isValidTime("7:30"), false); // needs leading zero
            assert.strictEqual(isValidTime("25:10"), false);
        });
    });

    describe("Email Format Validator (isValidEmail)", () => {
        it("should accept valid student emails", () => {
            assert.strictEqual(isValidEmail("student@university.edu"), true);
            assert.strictEqual(isValidEmail("alex.smith@college.ac.in"), true);
        });

        it("should reject invalid email patterns", () => {
            assert.strictEqual(isValidEmail("not-an-email"), false);
            assert.strictEqual(isValidEmail("missing@domain"), false);
            assert.strictEqual(isValidEmail("@nodomain.com"), false);
        });
    });

    describe("Middleware Error Rejection Behavior", () => {
        it("should reject sleep payload with invalid wakeTime", () => {
            const req = {
                body: {
                    date: "2026-11-20",
                    bedtime: "23:00",
                    wakeTime: "25:00" // invalid hour
                }
            };
            let capturedStatus = null;
            let capturedJson = null;
            const res = {
                status(code) {
                    capturedStatus = code;
                    return {
                        json(data) {
                            capturedJson = data;
                        }
                    };
                }
            };
            validateSleep(req, res, () => {});

            assert.strictEqual(capturedStatus, 400);
            assert.strictEqual(capturedJson.status, "error");
            assert.ok(capturedJson.errors.some(e => e.field === "wakeTime"));
        });

        it("should reject study payload with out-of-range productivity score", () => {
            const req = {
                body: {
                    date: "2026-11-20",
                    studyHours: 4.0,
                    focus: 4,
                    productivity: 15 // max allowed is 10
                }
            };
            let capturedStatus = null;
            let capturedJson = null;
            const res = {
                status(code) {
                    capturedStatus = code;
                    return {
                        json(data) {
                            capturedJson = data;
                        }
                    };
                }
            };
            validateStudy(req, res, () => {});

            assert.strictEqual(capturedStatus, 400);
            assert.strictEqual(capturedJson.status, "error");
            assert.ok(capturedJson.errors.some(e => e.field === "productivity"));
        });
    });
});
