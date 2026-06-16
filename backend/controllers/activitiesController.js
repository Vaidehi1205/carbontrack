import { body, param, validationResult } from "express-validator";
import Activity from "../models/Activity.js";
import { calculateEmission, factors } from "../data/factors.js";
import { toClientActivity } from "../services/analyticsService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const activityValidation = [
  body("category").isIn(Object.keys(factors)).withMessage("Invalid category"),
  body("type").custom((value, { req }) => {
    if (!factors[req.body.category]?.[value]) {
      throw new Error("Invalid activity type");
    }
    return true;
  }),
  body("date").matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Valid date required (YYYY-MM-DD)"),
  body("value").isFloat({ min: 0.1 }).withMessage("Value must be at least 0.1"),
  body("notes").optional().isLength({ max: 90 })
];

/**
 * GET /api/activities — List all activities for the authenticated user.
 */
export const listActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ userId: req.firebaseUser.uid }).sort({ date: -1, createdAt: -1 });
  res.json({ activities: activities.map(toClientActivity) });
});

/**
 * POST /api/activities — Create a new activity.
 */
export const createActivity = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { category, type, date, value, notes } = req.body;
  const factorData = factors[category][type];
  const emissionFactor = factorData.factor;
  const carbonEmission = calculateEmission(category, type, value);

  const activity = await Activity.create({
    userId: req.firebaseUser.uid,
    category,
    activityType: type,
    value,
    emissionFactor,
    carbonEmission,
    date: date.slice(0, 10),
    unit: factorData.unit,
    notes: notes || ""
  });

  res.status(201).json({ activity: toClientActivity(activity) });
});

/**
 * PUT /api/activities/:id — Update an existing activity.
 */
export const updateActivity = [
  param("id").isMongoId(),
  ...activityValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, type, date, value, notes } = req.body;
    const factorData = factors[category][type];

    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, userId: req.firebaseUser.uid },
      {
        category,
        activityType: type,
        value,
        emissionFactor: factorData.factor,
        carbonEmission: calculateEmission(category, type, value),
        date: date.slice(0, 10),
        unit: factorData.unit,
        notes: notes || ""
      },
      { new: true }
    );

    if (!activity) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({ activity: toClientActivity(activity) });
  })
];

/**
 * DELETE /api/activities/:id — Remove an activity.
 */
export const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findOneAndDelete({
    _id: req.params.id,
    userId: req.firebaseUser.uid
  });

  if (!activity) {
    return res.status(404).json({ error: "Activity not found" });
  }

  res.json({ success: true });
});

/**
 * POST /api/activities/sync — Bulk sync activities from client (migration).
 */
export const syncActivities = asyncHandler(async (req, res) => {
  const { activities } = req.body;
  if (!Array.isArray(activities)) {
    return res.status(400).json({ error: "activities array required" });
  }

  const existing = await Activity.countDocuments({ userId: req.firebaseUser.uid });
  if (existing > 0) {
    return res.json({ synced: 0, message: "User already has activities" });
  }

  const docs = activities.slice(0, 500).map((a) => {
    const factorData = factors[a.category]?.[a.type] || { factor: 0, unit: a.unit || "" };
    return {
      userId: req.firebaseUser.uid,
      category: a.category,
      activityType: a.type,
      value: a.value,
      emissionFactor: factorData.factor,
      carbonEmission: a.co2 || calculateEmission(a.category, a.type, a.value),
      date: a.date,
      unit: a.unit || factorData.unit,
      notes: a.notes || ""
    };
  });

  if (docs.length) {
    await Activity.insertMany(docs);
  }

  res.json({ synced: docs.length });
});
