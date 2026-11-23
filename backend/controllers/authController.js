const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const store = require("../config/store");

const JWT_SECRET = process.env.JWT_SECRET || "snoozescience_dreamlog_jwt_secret_key_2026";

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register a new student
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide all required fields" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await store.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }

        const user = await store.createUser({ name, email, password });
        const token = generateToken(user._id);

        res.status(201).json({
            message: "Student account created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" });
        }

        const user = await store.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Compare password
        let isMatch = false;
        if (typeof user.comparePassword === "function") {
            isMatch = await user.comparePassword(password);
        } else {
            isMatch = await bcrypt.compare(password, user.password);
        }

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user._id);

        res.json({
            message: "Logged in successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await store.findUserById(req.user.id || req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
