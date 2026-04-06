import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  receiverName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Message = mongoose.model("Message", messageSchema);
