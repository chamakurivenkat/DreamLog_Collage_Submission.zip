const store = require("../config/store");

// @desc    Save new study record
// @route   POST /api/study
exports.createStudyRecord = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            user: req.user ? (req.user.id || req.user._id) : null
        };

        if (!payload.date || payload.studyHours === undefined || payload.focus === undefined || payload.productivity === undefined) {
            return res.status(400).json({ message: "Missing required fields (date, studyHours, focus, productivity)" });
        }

        const record = await store.createStudy(payload);
        res.status(201).json({
            message: "Study record saved",
            data: record
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all study records
// @route   GET /api/study
exports.getAllStudyRecords = async (req, res) => {
    try {
        const filter = {};
        if (req.user) {
            filter.user = req.user.id || req.user._id;
        }
        const records = await store.getStudy(filter);
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete study record by ID
// @route   DELETE /api/study/:id
exports.deleteStudyRecord = async (req, res) => {
    try {
        const record = await store.deleteStudy(req.params.id);
        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }
        res.json({ message: "Study record deleted", id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
