const store = require("../config/store");

// @desc    Save new sleep record
// @route   POST /api/sleep
exports.createSleepRecord = async (req, res) => {
    try {
        const payload = {
            ...req.body,
            user: req.user ? (req.user.id || req.user._id) : null
        };

        if (!payload.date || !payload.bedtime || !payload.wakeTime || payload.sleepHours === undefined) {
            return res.status(400).json({ message: "Missing required fields (date, bedtime, wakeTime, sleepHours)" });
        }

        const record = await store.createSleep(payload);
        res.status(201).json({
            message: "Sleep record saved",
            data: record
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all sleep records
// @route   GET /api/sleep
exports.getAllSleepRecords = async (req, res) => {
    try {
        const filter = {};
        if (req.user) {
            filter.user = req.user.id || req.user._id;
        }
        const records = await store.getSleep(filter);
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete sleep record by ID
// @route   DELETE /api/sleep/:id
exports.deleteSleepRecord = async (req, res) => {
    try {
        const record = await store.deleteSleep(req.params.id);
        if (!record) {
            return res.status(404).json({ message: "Record not found" });
        }
        res.json({ message: "Sleep record deleted", id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
