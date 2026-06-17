import { body, param, validationResult } from "express-validator";
import { factors } from "../config/emissionFactors.js";
import {
  createUserActivity,
  deleteUserActivity,
  getUserActivities,
  syncUserActivities,
  toClientActivity,
  updateUserActivity
} from "../services/carbonService.js";
import { updateStreaks } from "../services/streakService.js";
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
  const activities = await getUserActivities(req.firebaseUser.uid);
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

  const activity = await createUserActivity(req.firebaseUser.uid, req.body);
  const activities = await getUserActivities(req.firebaseUser.uid);
  await updateStreaks(req.user, activities);

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

    const activity = await updateUserActivity(req.firebaseUser.uid, req.params.id, req.body);

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
  const activity = await deleteUserActivity(req.firebaseUser.uid, req.params.id);

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

  const synced = await syncUserActivities(req.firebaseUser.uid, activities);
  if (synced === 0) {
    return res.json({ synced: 0, message: "User already has activities" });
  }

  res.json({ synced });
});
