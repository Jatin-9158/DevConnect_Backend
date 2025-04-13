const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_URL
        );

    } catch (error) {
        console.error("MongoDB connection failed:", error.message);

    }
};

module.exports = { connectDB };
