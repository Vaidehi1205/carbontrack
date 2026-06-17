import { body, validationResult } from "express-validator";
import { registerUser, getUserByFirebaseUID, toClientUser } from "../services/userService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

export const registerValidation = [
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("country").optional().isLength({ max: 5 }),
  body("goal").optional().isIn(["climate", "cost", "health", "social"])
];

/**
 * POST /api/auth/register — Create MongoDB profile after Firebase signup.
 */
export const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error("[POST /api/auth/register] Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const user = await registerUser(req.firebaseUser.uid, {
    name: req.body.name,
    email: req.body.email || req.firebaseUser.email,
    country: req.body.country,
    goal: req.body.goal
  });

  res.status(201).json({ user: toClientUser(user) });
});

/**
 * GET /api/auth/me — Return current user profile.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = req.user || await getUserByFirebaseUID(req.firebaseUser.uid);
  if (!user) {
    return res.status(404).json({ error: "Profile not found" });
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
 * GET /api/auth/config — Public Firebase client config (no secrets).
 */
export const getPublicConfig = asyncHandler(async (req, res) => {
  res.json({
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || "",
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.FIREBASE_PROJECT_ID || ""
    },
    apiBase: process.env.API_BASE_URL || ""
  });
});
