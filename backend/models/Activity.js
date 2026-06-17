import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    category: { type: String, required: true },
    activityType: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
    emissionFactor: { type: Number, required: true },
    carbonEmission: { type: Number, required: true },
    date: { type: String, required: true },
    unit: { type: String, default: "" },
    notes: { type: String, default: "", maxlength: 90 }
  },
  { timestamps: true }
);

activitySchema.index({ userId: 1, date: -1 });
activitySchema.index({ category: 1 });
activitySchema.index({ userId: 1, category: 1 });

export default mongoose.model("Activity", activitySchema);
