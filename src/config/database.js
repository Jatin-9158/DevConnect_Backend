const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_URL);
        console.log("DB connected successfully");
    } catch (error) {
        console.error("DB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = { connectDB };
