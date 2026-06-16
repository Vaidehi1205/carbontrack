import { generateInsights } from "../services/geminiService.js";
import {
  buildEmissionContext,
  calculateScores,
  dailyTotals,
  getUserActivities,
  toClientActivity
} from "../services/analyticsService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * GET /api/dashboard — Dashboard metrics and chart data.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const activities = await getUserActivities(req.firebaseUser.uid);
  const scores = calculateScores(req.user, activities);
  const context = buildEmissionContext(req.user, activities);
  const weeklyTrend = dailyTotals(activities, 7);
  const monthlyTrend = dailyTotals(activities, 30);

  res.json({
    scores,
    breakdown: context.breakdown,
    trend: context.trend,
    weeklyTrend,
    monthlyTrend,
    activityCount: activities.length
  });
});

/**
 * GET /api/dashboard/insights — AI-generated insights.
 */
export const getInsights = asyncHandler(async (req, res) => {
  const insights = await generateInsights(req.user);
  res.json({ insights });
});

/**
 * GET /api/dashboard/summary — Quick stats for dashboard cards.
 */
export const getSummary = asyncHandler(async (req, res) => {
  const activities = await getUserActivities(req.firebaseUser.uid);
  const scores = calculateScores(req.user, activities);
  const context = buildEmissionContext(req.user, activities);

  res.json({
    carbonScore: scores.carbonScore,
    sustainabilityScore: scores.sustainabilityScore,
    targetProgress: Math.min(100, Math.round((scores.annualPace / req.user.annualTarget) * 100)),
    trend: context.trend,
    breakdown: context.breakdown,
    annualPace: scores.annualPace
  });
});

export { toClientActivity };
