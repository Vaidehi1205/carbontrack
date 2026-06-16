import { Router } from "express";
import { authMiddleware, requireProfile } from "../middleware/authMiddleware.js";
import {
  listActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  syncActivities,
  activityValidation
} from "../controllers/activitiesController.js";

const router = Router();

router.use(authMiddleware, requireProfile);

router.get("/", listActivities);
router.post("/", activityValidation, createActivity);
router.post("/sync", syncActivities);
router.put("/:id", updateActivity);
router.delete("/:id", deleteActivity);

export default router;
