import { generateInsights } from "../services/geminiService.js";
import { getDashboardData, getDashboardSummary } from "../services/dashboardService.js";
import { toClientActivity } from "../services/carbonService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * GET /api/dashboard — Dashboard metrics and chart data.
 */
export const getDashboard = asyncHandler(async (req, res) => {
  res.json(await getDashboardData(req.user, req.firebaseUser.uid));
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
  res.json(await getDashboardSummary(req.user, req.firebaseUser.uid));
});

export { toClientActivity };
