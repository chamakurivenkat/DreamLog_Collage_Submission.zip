const jwt = require("jsonwebtoken");
const store = require("../config/store");

const JWT_SECRET = process.env.JWT_SECRET || "snoozescience_dreamlog_jwt_secret_key_2026";

// Strict authentication
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await store.findUserById(decoded.id);

            if (!user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            req.user = user;
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Not authorized, token invalid or expired" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token provided" });
    }
};

// Optional authentication (for guest / demo modes)
const optionalAuth = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await store.findUserById(decoded.id);
            if (user) req.user = user;
        } catch (e) {
            // ignore error in optional mode
        }
    }
    next();
};

module.exports = { protect, optionalAuth };
