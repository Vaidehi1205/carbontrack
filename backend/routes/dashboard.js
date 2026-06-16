import { Router } from "express";
import { authMiddleware, requireProfile } from "../middleware/authMiddleware.js";
import { getDashboard, getInsights, getSummary } from "../controllers/dashboardController.js";

const router = Router();

router.use(authMiddleware, requireProfile);

router.get("/", getDashboard);
router.get("/insights", getInsights);
router.get("/summary", getSummary);

export default router;
