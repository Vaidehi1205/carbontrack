import { verifyIdToken } from "../config/firebase.js";
import User from "../models/User.js";

/**
 * Verify Firebase JWT from Authorization header and attach user to request.
 */
export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = await verifyIdToken(token);
    req.firebaseUser = decoded;

    const user = await User.findOne({ firebaseUID: decoded.uid });
    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Require that a MongoDB user profile exists for the authenticated Firebase user.
 */
export function requireProfile(req, res, next) {
  if (!req.user) {
    return res.status(404).json({ error: "User profile not found. Complete registration first." });
  }
  next();
}
