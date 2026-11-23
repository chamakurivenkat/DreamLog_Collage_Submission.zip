const mongoose = require("mongoose");

const studySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    date: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        default: "General Study"
    },
    studyHours: {
        type: Number,
        required: true,
        min: 0,
        max: 24
    },
    focus: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    productivity: {
        type: Number,
        min: 1,
        max: 10,
        required: true
    },
    tasks: {
        type: Number,
        min: 0,
        default: 0
    },
    notes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("StudyRecord", studySchema);
