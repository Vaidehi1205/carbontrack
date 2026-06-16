import { body, param, query, validationResult } from "express-validator";
import ChatHistory from "../models/ChatHistory.js";
import { generateCoachResponse, getSuggestedQuestions } from "../services/geminiService.js";
import { buildEmissionContext, getUserActivities } from "../services/analyticsService.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * POST /api/chatbot — Send a message to Carbon Coach.
 */
export const sendMessage = [
  body("message").trim().isLength({ min: 1, max: 2000 }).withMessage("Message required (max 2000 chars)"),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const { answer, context } = await generateCoachResponse(req.user, message);

    const chat = await ChatHistory.create({
      userId: req.firebaseUser.uid,
      question: message,
      answer,
      timestamp: new Date()
    });

    res.json({
      id: chat._id.toString(),
      question: message,
      answer,
      timestamp: chat.timestamp
    });
  })
];

/**
 * GET /api/chatbot/history — Load chat history with optional search.
 */
export const getHistory = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = { userId: req.firebaseUser.uid };

  if (search) {
    filter.$or = [
      { question: { $regex: search, $options: "i" } },
      { answer: { $regex: search, $options: "i" } }
    ];
  }

  const chats = await ChatHistory.find(filter)
    .sort({ timestamp: -1 })
    .limit(100);

  res.json({
    chats: chats.map((c) => ({
      id: c._id.toString(),
      question: c.question,
      answer: c.answer,
      timestamp: c.timestamp
    }))
  });
});

/**
 * DELETE /api/chatbot/history/:id — Delete a chat entry.
 */
export const deleteChat = asyncHandler(async (req, res) => {
  const chat = await ChatHistory.findOneAndDelete({
    _id: req.params.id,
    userId: req.firebaseUser.uid
  });

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  res.json({ success: true });
});

/**
 * GET /api/chatbot/suggestions — AI-suggested starter questions.
 */
export const getSuggestions = asyncHandler(async (req, res) => {
  const activities = await getUserActivities(req.firebaseUser.uid);
  const context = buildEmissionContext(req.user, activities);
  res.json({ suggestions: getSuggestedQuestions(context) });
});
