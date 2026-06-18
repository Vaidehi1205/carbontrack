import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUID: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    country: { type: String, default: "US" },
    goal: { type: String, default: "climate" },
    annualTarget: { type: Number, default: 7800 },
    // Extended profile fields preserved from MVP
    location: { type: String, default: "" },
    household: { type: Number, default: 2 },
    motivation: { type: String, default: "climate" },
    commute: { type: String, default: "car_petrol" },
    renewable: { type: Number, default: 18 },
    consent: { type: Boolean, default: false },
    avatar: { type: String, default: "A" },
    theme: { type: String, default: "light" },
    onboarded: { type: Boolean, default: false },
    started: [{ type: String }],
    dismissed: [{ type: String }],
    joinedChallenges: [{ type: String }],
    completedChallenges: [{ type: String }],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    badges: [{ type: String }]
  },
  { timestamps: true }
);

userSchema.index({ points: -1 });

export default mongoose.model("User", userSchema);
