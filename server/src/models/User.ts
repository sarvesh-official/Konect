import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  socketId: { type: String, required: true },
  name: { type: String, required: true },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  connectedAt: { type: Date, default: Date.now },
  disconnectedAt: { type: Date, default: null },
});

export const User = mongoose.model("User", userSchema);
