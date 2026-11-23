const express = require("express");
const router = express.Router();
const {
    createStudyRecord,
    getAllStudyRecords,
    deleteStudyRecord
} = require("../controllers/studyController");
const { optionalAuth } = require("../middleware/authMiddleware");
const { validateStudy } = require("../middleware/validationMiddleware");

router.use(optionalAuth);

// POST /api/study - Save study record with input validation
router.post("/", validateStudy, createStudyRecord);

// GET /api/study - Get all study records
router.get("/", getAllStudyRecords);

// DELETE /api/study/:id - Delete record
router.delete("/:id", deleteStudyRecord);

module.exports = router;
