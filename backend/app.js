import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import activitiesRoutes from "./routes/activities.js";
import dashboardRoutes from "./routes/dashboard.js";
import chatbotRoutes from "./routes/chatbot.js";
import usersRoutes from "./routes/users.js";
import leaderboardRoutes from "./routes/leaderboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

/**
 * Create the CarbonTrack Express app without starting the server.
 * @returns {import("express").Express}
 */
export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
  }));
  app.use(express.json({ limit: "50kb" }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Chat rate limit exceeded. Wait a moment." }
  });

  app.use("/api", apiLimiter);
  app.use("/api/chatbot", chatLimiter);
  app.use("/api/auth", authRoutes);
  app.use("/api/activities", activitiesRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/chatbot", chatbotRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(express.static(rootDir));
  app.use((req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ error: "API route not found" });
    }
    res.status(404).send("Not found");
  });
  app.use(errorHandler);

  return app;
}
