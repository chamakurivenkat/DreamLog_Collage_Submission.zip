const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("Database connection failed:", error.message);
        console.error("Tip: Ensure your local MongoDB service is active or update MONGO_URI in backend/.env with your MongoDB Atlas connection string.");
        process.exit(1);
    }
};

module.exports = connectDB;
