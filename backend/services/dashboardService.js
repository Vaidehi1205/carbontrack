import Activity from "../models/Activity.js";
import { CACHE_TTL_MS, SCORE_VALUES } from "../config/constants.js";
import { formatDate } from "../utils/formatDate.js";
import { getCache, setCache } from "./cacheService.js";
import { calculateScores } from "./scoreService.js";
import { getUserActivities } from "./carbonService.js";

/**
 * Build emission analytics context for AI prompts and dashboards.
 * @param {object} user User document.
 * @param {Array<object>} activities Activity documents.
 * @returns {object}
 */
export function buildEmissionContext(user, activities) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - SCORE_VALUES.MONTH_DAYS * 86400000);
  const recent = activities.filter((activity) => new Date(activity.date) >= thirtyDaysAgo);
  const categoryTotals = recent.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + activity.carbonEmission;
    return acc;
  }, {});
  const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0) || 1;
  const breakdown = Object.fromEntries(
    Object.entries(categoryTotals).map(([category, amount]) => [category, Math.round((amount / total) * 100)])
  );
  const weekAgo = new Date(now.getTime() - SCORE_VALUES.WEEK_DAYS * 86400000);
  const twoWeeksAgo = new Date(now.getTime() - SCORE_VALUES.WEEK_DAYS * 2 * 86400000);
  const thisWeekTotal = recent
    .filter((activity) => new Date(activity.date) >= weekAgo)
    .reduce((sum, activity) => sum + activity.carbonEmission, 0);
  const lastWeekTotal = recent
    .filter((activity) => {
      const date = new Date(activity.date);
      return date >= twoWeeksAgo && date < weekAgo;
    })
    .reduce((sum, activity) => sum + activity.carbonEmission, 0);
  const trend = lastWeekTotal
    ? thisWeekTotal > lastWeekTotal * 1.05
      ? "Increasing"
      : thisWeekTotal < lastWeekTotal * 0.95
        ? "Decreasing"
        : "Stable"
    : "Insufficient data";
  const topSources = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => `${category}: ${Math.round(amount * 100) / 100} kg`);

  return {
    userName: user.name,
    country: user.country,
    goal: user.goal || user.motivation,
    annualTarget: user.annualTarget,
    breakdown,
    trend,
    topSources,
    totalRecentKg: Math.round(total * 100) / 100,
    activityCount: recent.length
  };
}

/**
 * Get daily emission totals for chart data.
 * @param {Array<object>} activities Activity documents.
 * @param {number} days Number of days to include.
 * @returns {Array<object>}
 */
export function dailyTotals(activities, days) {
  const totals = activities.reduce((acc, activity) => {
    acc[activity.date] = (acc[activity.date] || 0) + activity.carbonEmission;
    return acc;
  }, {});
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    const key = formatDate(date);
    return { date: key, value: Math.round((totals[key] || 0) * 100) / 100 };
  });
}

/**
 * Aggregate category totals directly in MongoDB for scalable reporting.
 * @param {string} userId Firebase user id.
 * @returns {Promise<Array<object>>}
 */
export function aggregateCategoryTotals(userId) {
  return Activity.aggregate([
    { $match: { userId } },
    { $group: { _id: "$category", totalEmission: { $sum: "$carbonEmission" }, count: { $sum: 1 } } },
    { $sort: { totalEmission: -1 } }
  ]);
}

/**
 * Build the complete dashboard response with short-lived caching.
 * @param {object} user User document.
 * @param {string} userId Firebase user id.
 * @returns {Promise<object>}
 */
export async function getDashboardData(user, userId) {
  const cacheKey = `dashboard:${userId}:full`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const [activities, categoryTotals] = await Promise.all([
    getUserActivities(userId),
    aggregateCategoryTotals(userId)
  ]);
  const scores = calculateScores(user, activities);
  const context = buildEmissionContext(user, activities);
  const data = {
    scores,
    score: scores.score,
    monthlyEmission: scores.monthlyEmission,
    breakdown: context.breakdown,
    categoryTotals,
    trend: context.trend,
    weeklyTrend: dailyTotals(activities, SCORE_VALUES.WEEK_DAYS),
    monthlyTrend: dailyTotals(activities, SCORE_VALUES.MONTH_DAYS),
    activityCount: activities.length
  };

  return setCache(cacheKey, data, CACHE_TTL_MS.DASHBOARD);
}

/**
 * Build dashboard summary response.
 * @param {object} user User document.
 * @param {string} userId Firebase user id.
 * @returns {Promise<object>}
 */
export async function getDashboardSummary(user, userId) {
  const dashboard = await getDashboardData(user, userId);
  const scores = dashboard.scores;
  return {
    carbonScore: scores.carbonScore,
    sustainabilityScore: scores.sustainabilityScore,
    score: scores.score,
    grade: scores.grade,
    monthlyEmission: scores.monthlyEmission,
    targetProgress: Math.min(100, Math.round((scores.annualPace / user.annualTarget) * 100)),
    trend: dashboard.trend,
    breakdown: dashboard.breakdown,
    annualPace: scores.annualPace
  };
}
