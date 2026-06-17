import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    question: { type: String, required: true, maxlength: 2000 },
    answer: { type: String, required: true, maxlength: 8000 },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

chatHistorySchema.index({ userId: 1, timestamp: -1 });
chatHistorySchema.index({ question: "text", answer: "text" });

export default mongoose.model("ChatHistory", chatHistorySchema);
