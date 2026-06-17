import { body, validationResult } from "express-validator";
import { updateUserProfile, toClientUser } from "../services/userService.js";
import { assignBadges } from "../services/badgeService.js";
import Challenge from "../models/Challenge.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const profileValidation = [
  body("name").optional().trim().isLength({ min: 2, max: 80 }),
  body("country").optional().isLength({ max: 5 }),
  body("annualTarget").optional().isFloat({ min: 1000 }),
  body("household").optional().isInt({ min: 1, max: 8 }),
  body("renewable").optional().isInt({ min: 0, max: 100 })
];

/**
 * PUT /api/users/profile — Update user profile.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const updates = { ...req.body };
  if (updates.target !== undefined) {
    updates.annualTarget = updates.target;
    delete updates.target;
  }

  const user = await updateUserProfile(req.firebaseUser.uid, updates);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    user: toClientUser(user),
    meta: {
      started: user.started,
      dismissed: user.dismissed,
      joinedChallenges: user.joinedChallenges,
      completedChallenges: user.completedChallenges,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      points: user.points || 0,
      badges: user.badges || [],
      theme: user.theme,
      onboarded: user.onboarded
    }
  });
});

/**
 * POST /api/users/challenges — Join or complete a challenge.
 */
export const updateChallenge = asyncHandler(async (req, res) => {
  const { challengeName, action } = req.body;
  if (!challengeName || !["join", "complete"].includes(action)) {
    return res.status(400).json({ error: "challengeName and action (join|complete) required" });
  }

  const status = action === "complete" ? "completed" : "joined";
  const rewardPoints = action === "complete" ? 100 : 50;

  const challenge = await Challenge.findOneAndUpdate(
    { userId: req.firebaseUser.uid, challengeName },
    { status, rewardPoints },
    { upsert: true, new: true }
  );

  const field = action === "complete" ? "completedChallenges" : "joinedChallenges";
  const user = await updateUserProfile(req.firebaseUser.uid, {
    [field]: [...new Set([...(req.user[field] || []), challengeName])],
    points: (req.user.points || 0) + rewardPoints
  });
  await assignBadges(user);

  res.json({ challenge, user: toClientUser(user) });
});

/**
 * GET /api/users/challenges — List user challenges.
 */
export const listChallenges = asyncHandler(async (req, res) => {
  const challenges = await Challenge.find({ userId: req.firebaseUser.uid });
  res.json({ challenges });
});
