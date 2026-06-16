import { Router } from "express";
import { authMiddleware, requireProfile } from "../middleware/authMiddleware.js";
import {
  updateProfile,
  profileValidation,
  updateChallenge,
  listChallenges
} from "../controllers/usersController.js";

const router = Router();

router.use(authMiddleware, requireProfile);

router.put("/profile", profileValidation, updateProfile);
router.get("/challenges", listChallenges);
router.post("/challenges", updateChallenge);

export default router;
