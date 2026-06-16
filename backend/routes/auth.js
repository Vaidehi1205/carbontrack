import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { register, registerValidation, getMe, getPublicConfig } from "../controllers/authController.js";

const router = Router();

router.get("/config", getPublicConfig);
router.post("/register", authMiddleware, registerValidation, register);
router.get("/me", authMiddleware, getMe);

export default router;
