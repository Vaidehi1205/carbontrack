import { SCORE_GRADES } from "../config/constants.js";

/**
 * Clamp a numeric score into the public 0-100 range.
 * @param {number} score Raw score.
 * @returns {number}
 */
export function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Convert a numeric sustainability score to a letter grade.
 * @param {number} score Sustainability score.
 * @returns {string}
 */
export function gradeForScore(score) {
  return SCORE_GRADES.find((entry) => score >= entry.min)?.grade || "D";
}
