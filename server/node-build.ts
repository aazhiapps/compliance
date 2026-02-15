import path from "path";
import { createServer } from "./index";
import * as express from "express";
import { validateEnv } from "./config/env";
import { dbConnection } from "./config/database";
import { seedAllData } from "./utils/seedData";
import rateLimit from "express-rate-limit";

// Validate environment variables before starting server
validateEnv();

// Initialize app
const app = createServer();
const port = process.env.PORT || 3000;

// Connect to MongoDB and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await dbConnection.connect();

    // Seed demo data in development/testing only
    if (process.env.NODE_ENV !== "production") {
      console.log("Seeding demo data...");
      await seedAllData();
    }

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

    // Start the server
    app.listen(port, () => {
      console.log(`🚀 Fusion Starter server running on port ${port}`);
      console.log(`📱 Frontend: http://localhost:${port}`);
      console.log(`🔧 API: http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log("🛑 Shutting down gracefully...");
  await dbConnection.disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start the server
startServer();
