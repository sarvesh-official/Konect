import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  senderNameKey: { type: String, required: true, index: true },
  receiverName: { type: String, required: true },
  receiverNameKey: { type: String, required: true, index: true },
  conversationKey: { type: String, required: true, index: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Message = mongoose.model("Message", messageSchema);
