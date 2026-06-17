import { Router } from "express";
import { authMiddleware, requireProfile } from "../middleware/authMiddleware.js";
import { listLeaderboard, rebuildLeaderboardHandler } from "../controllers/leaderboardController.js";

const router = Router();

router.use(authMiddleware, requireProfile);

router.get("/", listLeaderboard);
router.post("/rebuild", rebuildLeaderboardHandler);

export default router;
