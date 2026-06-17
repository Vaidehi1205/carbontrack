import { asyncHandler } from "../middleware/errorHandler.js";
import { getLeaderboard, rebuildLeaderboard } from "../services/leaderboardService.js";

/**
 * GET /api/leaderboard - List ranked users by sustainability score.
 */
export const listLeaderboard = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Number(req.query.limit || 20));
  const leaderboard = await getLeaderboard(limit);
  res.json({ leaderboard });
});

/**
 * POST /api/leaderboard/rebuild - Recompute leaderboard rankings.
 */
export const rebuildLeaderboardHandler = asyncHandler(async (req, res) => {
  const leaderboard = await rebuildLeaderboard();
  res.json({ leaderboard });
});
