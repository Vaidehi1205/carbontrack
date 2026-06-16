import { Router } from "express";
import { authMiddleware, requireProfile } from "../middleware/authMiddleware.js";
import {
  sendMessage,
  getHistory,
  deleteChat,
  getSuggestions
} from "../controllers/chatbotController.js";

const router = Router();

router.use(authMiddleware, requireProfile);

router.post("/", sendMessage);
router.get("/history", getHistory);
router.delete("/history/:id", deleteChat);
router.get("/suggestions", getSuggestions);

export default router;
