const mongoose = require("mongoose");

const sleepSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    date: {
        type: String,
        required: true
    },
    bedtime: {
        type: String,
        required: true
    },
    wakeTime: {
        type: String,
        required: true
    },
    sleepHours: {
        type: Number,
        required: true,
        min: 0,
        max: 24
    },
    quality: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
    },
    notes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

module.exports = mongoose.model("SleepRecord", sleepSchema);
