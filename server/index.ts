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

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/profile", handleGetProfile);
  app.post("/api/auth/logout", handleLogout);

  // Application routes
  app.get("/api/applications", handleGetApplications);
  app.post("/api/applications", handleCreateApplication);
  app.post("/api/applications/:id/documents", handleUploadDocument);
  
  // Document routes
  app.get("/api/documents", handleGetUserDocuments);

  return app;
}
