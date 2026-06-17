import { BADGES } from "../config/constants.js";

/**
 * Determine badges earned by points and sustained logging.
 * @param {object} user User document.
 * @returns {Array<string>}
 */
export function calculateBadges(user) {
  const points = user.points || 0;
  const longestStreak = user.longestStreak || 0;
  const badges = new Set(user.badges || []);

  if (points >= 50) badges.add(BADGES.GREEN_BEGINNER);
  if (points >= 250 || longestStreak >= 7) badges.add(BADGES.ECO_EXPLORER);
  if (points >= 750 || longestStreak >= 30) badges.add(BADGES.CARBON_HERO);
  if (points >= 1500 || longestStreak >= 90) badges.add(BADGES.EARTH_CHAMPION);

  return [...badges];
}

/**
 * Assign earned badges to a user document.
 * @param {object} user User document.
 * @returns {Promise<object>}
 */
export async function assignBadges(user) {
  const badges = calculateBadges(user);
  user.badges = badges;
  await user.save();
  return user;
}
