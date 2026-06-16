import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    challengeName: { type: String, required: true },
    status: { type: String, enum: ["joined", "completed", "abandoned"], default: "joined" },
    rewardPoints: { type: Number, default: 50 }
  },
  { timestamps: true }
);

challengeSchema.index({ userId: 1, challengeName: 1 }, { unique: true });

export default mongoose.model("Challenge", challengeSchema);
