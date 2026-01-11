// server/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import { runAgent } from "./controllers/agentController.js";
import { getStateMemory, getStepHistory, getMetrics } from "./controllers/memoryController.js";
import { preRunGuard } from "./middleware/policyGuard.js";
import settings from "./config/settings.json" with { type: "json" };

import { info, warn, error } from "./utils/logger.js";

info("[BOOT] Starting server");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
info(`[BOOT] Connecting MongoDB: ${settings.mongo_uri}`);
mongoose
  .connect(settings.mongo_uri)
  .then(() => info("[DB] MongoDB connected"))
  .catch((err) => {
    error("[DB] Connection failed", err);
    process.exit(1);
  });

// Health check
app.get("/health", (_, res) => {
  info("[API] /health");
  res.json({ ok: true });
});

// Agent routes
app.post("/agent/run", preRunGuard, runAgent);

// Memory routes
app.get("/memory/state", getStateMemory);
app.get("/memory/steps", getStepHistory);
app.get("/memory/metrics", getMetrics);

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  info("[DB] MongoDB disconnected");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await mongoose.disconnect();
  info("[DB] MongoDB disconnected");
  process.exit(0);
});

// Start server
app.listen(settings.port, () =>
  info(`[BOOT] Server running on ${settings.port}`)
);
