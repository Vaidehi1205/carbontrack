import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    rank: { type: Number, required: true, index: true },
    score: { type: Number, required: true, index: true },
    totalEmission: { type: Number, required: true, index: true }
  },
  { timestamps: true }
);

leaderboardSchema.index({ score: -1, totalEmission: 1 });

export default mongoose.model("Leaderboard", leaderboardSchema);
