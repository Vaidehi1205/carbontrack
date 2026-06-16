import mongoose from "mongoose";

/**
 * Connect to MongoDB Atlas using MONGO_URI from environment variables.
 * Exits the process if the connection fails in production.
 */
export default async function connectDB() {
  const uri = process.env.MONGO_URI?.trim();

  if (!uri) {
    const error = new Error("MONGO_URI is not set. Database features will not work until configured.");
    console.error(error.message);
    throw error;
  }

  try {
    await mongoose.connect(uri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.error("Check MONGO_URI credentials, Atlas user password, and network access.");
    throw error;
  }
}
