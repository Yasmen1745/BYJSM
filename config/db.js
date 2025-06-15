import mongoose from "mongoose";
import "dotenv/config";

const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1); // Exit process with failure
    }
}

export default connectDb;