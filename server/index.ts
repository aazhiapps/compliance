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
import { authenticateToken } from "./middleware/auth";
import { validateRequest, schemas } from "./middleware/validation";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logging";

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

  // Health check endpoint
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Public auth routes with validation
  app.post("/api/auth/signup", validateRequest(schemas.signup), handleSignup);
  app.post("/api/auth/login", validateRequest(schemas.login), handleLogin);
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
    validateRequest(schemas.uploadDocument),
    handleUploadDocument,
  );

  // Protected document routes
  app.get("/api/documents", authenticateToken, handleGetUserDocuments);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
