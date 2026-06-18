import User from "../models/User.js";
import { sanitizeText } from "../utils/sanitize.js";

/**
 * Register a new user profile in MongoDB after Firebase account creation.
 */
export async function registerUser(firebaseUID, profile) {
  const existing = await User.findOne({ firebaseUID });
  if (existing) {
    return existing;
  }

  const emailTaken = await User.findOne({ email: profile.email.toLowerCase() });
  if (emailTaken) {
    const error = new Error("Email already registered");
    error.status = 409;
    throw error;
  }

  return User.create({
    firebaseUID,
    name: sanitizeText(profile.name, 80),
    email: sanitizeText(profile.email, 254).toLowerCase(),
    country: sanitizeText(profile.country || "US", 5),
    goal: sanitizeText(profile.goal || profile.motivation || "climate", 40),
    annualTarget: profile.annualTarget || 7800,
    motivation: sanitizeText(profile.goal || profile.motivation || "climate", 40),
    avatar: sanitizeText(profile.name, 80)?.charAt(0)?.toUpperCase() || "U",
    onboarded: true
  });
}

/**
 * Get user profile by Firebase UID.
 */
export async function getUserByFirebaseUID(firebaseUID) {
  return User.findOne({ firebaseUID });
}

/**
 * Update user profile fields.
 */
export async function updateUserProfile(firebaseUID, updates) {
  const allowed = [
    "name", "country", "goal", "annualTarget", "location", "household",
    "motivation", "commute", "renewable", "consent", "avatar",
    "theme", "onboarded", "started", "dismissed", "joinedChallenges", "completedChallenges",
    "currentStreak", "longestStreak", "points", "badges"
  ];

  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = typeof updates[key] === "string" ? sanitizeText(updates[key], 500) : updates[key];
  }

  if (sanitized.name) {
    sanitized.avatar = sanitized.name.charAt(0).toUpperCase();
  }

  return User.findOneAndUpdate({ firebaseUID }, sanitized, { new: true, runValidators: true });
}

/**
 * Convert MongoDB user to frontend state.user shape.
 */
export function toClientUser(user) {
  return {
    name: user.name,
    location: user.location || "",
    country: user.country,
    household: user.household,
    motivation: user.motivation || user.goal,
    commute: user.commute,
    renewable: user.renewable,
    target: user.annualTarget,
    consent: user.consent,
    avatar: user.avatar,
    email: user.email,
    goal: user.goal,
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    points: user.points || 0,
    badges: user.badges || []
  };
}
