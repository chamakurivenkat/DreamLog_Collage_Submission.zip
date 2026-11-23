const { describe, it } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../../server");

describe("API Integration Tests", () => {
    describe("System Health & Monitoring Endpoints", () => {
        it("GET /api/health should return status 200 and healthy status", async () => {
            const res = await request(app).get("/api/health");
            assert.strictEqual(res.status, 200);
            assert.strictEqual(res.body.status, "healthy");
            assert.strictEqual(res.body.name, "DreamLog Backend API");
            assert.ok(res.headers["x-request-id"]);
        });

        it("GET /api/monitoring should return server uptime, memory, and traffic metrics", async () => {
            const res = await request(app).get("/api/monitoring");
            assert.strictEqual(res.status, 200);
            assert.ok(res.body.server);
            assert.ok(res.body.memoryUsage);
            assert.ok(res.body.trafficMetrics);
            assert.ok(res.body.trafficMetrics.totalRequests > 0);
        });
    });

    describe("Authentication Endpoints (/api/auth)", () => {
        const testEmail = `student_${Date.now()}@university.edu`;

        it("POST /api/auth/register should create a new student account", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Alex Tester",
                    email: testEmail,
                    password: "password123"
                });

            assert.strictEqual(res.status, 201);
            assert.ok(res.body.token);
            assert.strictEqual(res.body.user.email, testEmail);
        });

        it("POST /api/auth/register should reject invalid email format", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Invalid Student",
                    email: "not-an-email",
                    password: "password123"
                });

            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.body.status, "error");
        });

        it("POST /api/auth/login should authenticate with valid credentials", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: "password123"
                });

            assert.strictEqual(res.status, 200);
            assert.ok(res.body.token);
        });

        it("POST /api/auth/login should reject incorrect password", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: testEmail,
                    password: "wrongpassword"
                });

            assert.strictEqual(res.status, 401);
        });
    });

    describe("Sleep Tracker CRUD & Validation (/api/sleep)", () => {
        let createdRecordId = null;

        it("POST /api/sleep should create a valid sleep log", async () => {
            const res = await request(app)
                .post("/api/sleep")
                .send({
                    date: "2026-11-20",
                    bedtime: "23:00",
                    wakeTime: "07:00",
                    sleepHours: 8.0,
                    quality: 4,
                    notes: "Solid restful night"
                });

            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.message, "Sleep record saved");
            assert.ok(res.body.data._id);
            createdRecordId = res.body.data._id;
        });

        it("POST /api/sleep should reject malformed bedtime", async () => {
            const res = await request(app)
                .post("/api/sleep")
                .send({
                    date: "2026-11-20",
                    bedtime: "25:99",
                    wakeTime: "07:00"
                });

            assert.strictEqual(res.status, 400);
            assert.strictEqual(res.body.status, "error");
        });

        it("GET /api/sleep should retrieve all sleep logs", async () => {
            const res = await request(app).get("/api/sleep");
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body));
            assert.ok(res.body.length > 0);
        });

        it("DELETE /api/sleep/:id should delete the created record", async () => {
            if (createdRecordId) {
                const res = await request(app).delete(`/api/sleep/${createdRecordId}`);
                assert.strictEqual(res.status, 200);
            }
        });
    });

    describe("Study Productivity CRUD & Validation (/api/study)", () => {
        let createdStudyId = null;

        it("POST /api/study should create a valid study session", async () => {
            const res = await request(app)
                .post("/api/study")
                .send({
                    date: "2026-11-20",
                    subject: "Operating Systems",
                    studyHours: 3.5,
                    focus: 4,
                    productivity: 8,
                    tasks: 5,
                    notes: "Thread synchronization"
                });

            assert.strictEqual(res.status, 201);
            assert.ok(res.body.data._id);
            createdStudyId = res.body.data._id;
        });

        it("POST /api/study should reject negative study hours", async () => {
            const res = await request(app)
                .post("/api/study")
                .send({
                    date: "2026-11-20",
                    subject: "Physics",
                    studyHours: -2,
                    focus: 3,
                    productivity: 5
                });

            assert.strictEqual(res.status, 400);
        });

        it("GET /api/study should return an array of study sessions", async () => {
            const res = await request(app).get("/api/study");
            assert.strictEqual(res.status, 200);
            assert.ok(Array.isArray(res.body));
        });

        it("DELETE /api/study/:id should delete the created study session", async () => {
            if (createdStudyId) {
                const res = await request(app).delete(`/api/study/${createdStudyId}`);
                assert.strictEqual(res.status, 200);
            }
        });
    });

    describe("Analytics & Seeder (/api/analytics)", () => {
        it("POST /api/analytics/seed should seed 21 days of realistic data", async () => {
            const res = await request(app).post("/api/analytics/seed");
            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.seededDays, 21);
        });

        it("GET /api/analytics should compute Pearson r, regression, and sleep debt", async () => {
            const res = await request(app).get("/api/analytics");
            assert.strictEqual(res.status, 200);
            assert.ok(res.body.summary);
            assert.ok(res.body.correlation);
            assert.ok(typeof res.body.summary.avgSleep === "number");
            assert.ok(typeof res.body.summary.avgStudy === "number");
            assert.ok(typeof res.body.summary.sleepDebt === "number");
        });
    });
});
