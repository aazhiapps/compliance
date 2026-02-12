import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  handleSignup,
  handleLogin,
  handleGetProfile,
  handleLogout,
  handleGetApplications,
  handleCreateApplication,
  handleUploadDocument,
  handleGetUserDocuments,
} from "./routes/auth";
import {
  handleGetAllUsers,
  handleGetAllApplications,
  handleUpdateApplicationStatus,
  handleGetApplicationById,
  handleGetUserById,
  handleGetAdminStats,
} from "./routes/admin";
import { authenticateToken } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";
import { validateRequest, schemas } from "./middleware/validation";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logging";
import {
  apiLimiter,
  authLimiter,
  fileLimiter,
} from "./middleware/rateLimiter";

export function createServer() {
  const app = express();

  // Global middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Apply rate limiting to all API routes
  app.use("/api/", apiLimiter);

  // Health check endpoint
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Public auth routes with validation and rate limiting
  app.post(
    "/api/auth/signup",
    authLimiter,
    validateRequest(schemas.signup),
    handleSignup,
  );
  app.post(
    "/api/auth/login",
    authLimiter,
    validateRequest(schemas.login),
    handleLogin,
  );
  app.post("/api/auth/logout", handleLogout);

  // Protected auth routes
  app.get("/api/auth/profile", authenticateToken, handleGetProfile);

  // Protected application routes
  app.get("/api/applications", authenticateToken, handleGetApplications);
  app.post(
    "/api/applications",
    authenticateToken,
    validateRequest(schemas.createApplication),
    handleCreateApplication,
  );
  app.post(
    "/api/applications/:id/documents",
    authenticateToken,
    fileLimiter,
    validateRequest(schemas.uploadDocument),
    handleUploadDocument,
  );

  // Protected document routes
  app.get("/api/documents", authenticateToken, handleGetUserDocuments);

  // Admin routes (protected by admin role)
  app.get("/api/admin/stats", authenticateToken, requireAdmin, handleGetAdminStats);
  app.get("/api/admin/users", authenticateToken, requireAdmin, handleGetAllUsers);
  app.get("/api/admin/users/:id", authenticateToken, requireAdmin, handleGetUserById);
  app.get("/api/admin/applications", authenticateToken, requireAdmin, handleGetAllApplications);
  app.get("/api/admin/applications/:id", authenticateToken, requireAdmin, handleGetApplicationById);
  app.patch("/api/admin/applications/:id", authenticateToken, requireAdmin, handleUpdateApplicationStatus);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
