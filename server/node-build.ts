import path from "path";
import { createServer } from "./index";
import * as express from "express";
import { validateEnv } from "./config/env";
import rateLimit from "express-rate-limit";

// Validate environment variables before starting server
validateEnv();

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Rate limiter for static file serving
const staticFileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Generous limit for legitimate use
  message: "Too many requests for static files",
  standardHeaders: true,
  legacyHeaders: false,
});

// Handle React Router - serve index.html for all non-API routes
app.use(staticFileLimiter, (req, res, next) => {
  // Skip for API routes - let them hit the 404 handler below
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Serve index.html for all other routes (React Router handles these)
  res.sendFile(path.join(distPath, "index.html"));
});

// 404 handler for API routes not matched
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found",
    });
  }
  next();
});

app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
