import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderSocketId: { type: String, required: true },
  senderName: { type: String, required: true },
  receiverSocketId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Message = mongoose.model("Message", messageSchema);
