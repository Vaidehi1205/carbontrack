import { formatDate } from "../utils/formatDate.js";
import { assignBadges } from "./badgeService.js";

/**
 * Calculate the current consecutive daily logging streak.
 * @param {Array<object>} activities Activity documents.
 * @returns {number}
 */
export function calculateCurrentStreak(activities) {
  const loggedDates = new Set(activities.map((activity) => activity.date));
  let streak = 0;
  const cursor = new Date();

  while (loggedDates.has(formatDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Update user streak and points from activity history.
 * @param {object} user User document.
 * @param {Array<object>} activities Activity documents.
 * @returns {Promise<object>}
 */
export async function updateStreaks(user, activities) {
  const currentStreak = calculateCurrentStreak(activities);
  user.currentStreak = currentStreak;
  user.longestStreak = Math.max(user.longestStreak || 0, currentStreak);
  user.points = Math.max(user.points || 0, activities.length * 10);
  return assignBadges(user);
}
