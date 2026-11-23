const express = require("express");
const router = express.Router();
const {
    createSleepRecord,
    getAllSleepRecords,
    deleteSleepRecord
} = require("../controllers/sleepController");
const { optionalAuth } = require("../middleware/authMiddleware");
const { validateSleep } = require("../middleware/validationMiddleware");

router.use(optionalAuth);

// POST /api/sleep - Save sleep record with input validation
router.post("/", validateSleep, createSleepRecord);

// GET /api/sleep - Get all sleep records
router.get("/", getAllSleepRecords);

// DELETE /api/sleep/:id - Delete record
router.delete("/:id", deleteSleepRecord);

module.exports = router;
