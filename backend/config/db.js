import mongoose from "mongoose";

/**
 * Connect to MongoDB Atlas using MONGO_URI from environment variables.
 * Exits the process if the connection fails in production.
 */
export default async function connectDB() {
  let uri = process.env.MONGO_URI?.trim();

  if (uri?.startsWith('"') && uri.endsWith('"')) {
    uri = uri.slice(1, -1).trim();
  }

  if (!uri) {
    const error = new Error("MONGO_URI is not set. Database features will not work until configured.");
    console.error(error.message);
    throw error;
  }

  const dbName = process.env.MONGO_DB?.trim() || "carbontrack";

  try {
    const connection = await mongoose.connect(uri, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      dbName
    });
    console.log(`MongoDB connected to ${connection.connection.name} at ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    console.error("Check MONGO_URI credentials, Atlas user password, network access, and database name.");
    throw error;
  }
}
