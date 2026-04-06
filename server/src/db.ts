import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI not set — running without database persistence");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}
