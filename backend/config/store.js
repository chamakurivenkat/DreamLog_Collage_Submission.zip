const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const SleepRecord = require("../models/SleepRecord");
const StudyRecord = require("../models/StudyRecord");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "../data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readLocalStore() {
    try {
        if (fs.existsSync(STORE_FILE)) {
            const raw = fs.readFileSync(STORE_FILE, "utf-8");
            return JSON.parse(raw);
        }
    } catch (e) {
        console.error("Store read error:", e);
    }
    return { users: [], sleepRecords: [], studyRecords: [] };
}

function writeLocalStore(data) {
    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
        console.error("Store write error:", e);
    }
}

const isMongoActive = () => mongoose.connection && mongoose.connection.readyState === 1;

module.exports = {
    isMongoActive,

    // Users
    async createUser(userData) {
        if (isMongoActive()) {
            return await User.create(userData);
        }
        const store = readLocalStore();
        const existing = store.users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
        if (existing) throw new Error("User already exists with this email");

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        const newUser = {
            _id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name: userData.name,
            email: userData.email.toLowerCase(),
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        store.users.push(newUser);
        writeLocalStore(store);
        return { _id: newUser._id, name: newUser.name, email: newUser.email };
    },

    async findUserByEmail(email) {
        if (isMongoActive()) {
            return await User.findOne({ email: email.toLowerCase() });
        }
        const store = readLocalStore();
        return store.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    async findUserById(id) {
        if (isMongoActive()) {
            return await User.findById(id).select("-password");
        }
        const store = readLocalStore();
        const u = store.users.find(user => user._id.toString() === id.toString());
        if (!u) return null;
        return { _id: u._id, name: u.name, email: u.email, createdAt: u.createdAt };
    },

    // Sleep Records
    async createSleep(data) {
        if (isMongoActive()) {
            return await SleepRecord.create(data);
        }
        const store = readLocalStore();
        const newRecord = {
            _id: `sleep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            user: data.user || null,
            date: data.date,
            bedtime: data.bedtime,
            wakeTime: data.wakeTime,
            sleepHours: Number(data.sleepHours),
            quality: Number(data.quality) || 3,
            notes: data.notes || "",
            createdAt: new Date().toISOString()
        };
        store.sleepRecords.push(newRecord);
        writeLocalStore(store);
        return newRecord;
    },

    async getSleep(filter = {}) {
        if (isMongoActive()) {
            return await SleepRecord.find(filter).sort({ date: -1 });
        }
        const store = readLocalStore();
        let records = [...store.sleepRecords];
        if (filter.user) {
            records = records.filter(r => r.user === filter.user || !r.user);
        }
        records.sort((a, b) => b.date.localeCompare(a.date));
        return records;
    },

    async deleteSleep(id) {
        if (isMongoActive()) {
            return await SleepRecord.findByIdAndDelete(id);
        }
        const store = readLocalStore();
        const idx = store.sleepRecords.findIndex(r => r._id === id);
        if (idx === -1) return null;
        const deleted = store.sleepRecords.splice(idx, 1)[0];
        writeLocalStore(store);
        return deleted;
    },

    // Study Records
    async createStudy(data) {
        if (isMongoActive()) {
            return await StudyRecord.create(data);
        }
        const store = readLocalStore();
        const newRecord = {
            _id: `study_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            user: data.user || null,
            date: data.date,
            subject: data.subject || "General Study",
            studyHours: Number(data.studyHours),
            focus: Number(data.focus),
            productivity: Number(data.productivity),
            tasks: Number(data.tasks) || 0,
            notes: data.notes || "",
            createdAt: new Date().toISOString()
        };
        store.studyRecords.push(newRecord);
        writeLocalStore(store);
        return newRecord;
    },

    async getStudy(filter = {}) {
        if (isMongoActive()) {
            return await StudyRecord.find(filter).sort({ date: -1 });
        }
        const store = readLocalStore();
        let records = [...store.studyRecords];
        if (filter.user) {
            records = records.filter(r => r.user === filter.user || !r.user);
        }
        records.sort((a, b) => b.date.localeCompare(a.date));
        return records;
    },

    async deleteStudy(id) {
        if (isMongoActive()) {
            return await StudyRecord.findByIdAndDelete(id);
        }
        const store = readLocalStore();
        const idx = store.studyRecords.findIndex(r => r._id === id);
        if (idx === -1) return null;
        const deleted = store.studyRecords.splice(idx, 1)[0];
        writeLocalStore(store);
        return deleted;
    },

    // Seed multiple demo days
    async seedRecords(sleeps, studies) {
        if (isMongoActive()) {
            await SleepRecord.deleteMany({});
            await StudyRecord.deleteMany({});
            await SleepRecord.insertMany(sleeps);
            await StudyRecord.insertMany(studies);
            return { sleeps: sleeps.length, studies: studies.length };
        }
        const store = readLocalStore();
        store.sleepRecords = sleeps.map((s, i) => ({
            _id: `seed_sleep_${i}_${Date.now()}`,
            ...s,
            createdAt: new Date().toISOString()
        }));
        store.studyRecords = studies.map((st, i) => ({
            _id: `seed_study_${i}_${Date.now()}`,
            ...st,
            createdAt: new Date().toISOString()
        }));
        writeLocalStore(store);
        return { sleeps: sleeps.length, studies: studies.length };
    }
};
