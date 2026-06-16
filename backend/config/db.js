import mongoose from "mongoose";

/**
 * Connect to MongoDB Atlas using MONGO_URI from environment variables.
 * Exits the process if the connection fails in production.
 */
export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn("MONGO_URI is not set. Database features will not work until configured.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}
