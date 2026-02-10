import { RequestHandler } from "express";
import { SignupRequest, LoginRequest, AuthResponse, User } from "@shared/auth";

// In-memory storage (replace with database in production)
const users: Map<string, User & { password: string }> = new Map();
const applications: Map<string, any> = new Map();

// Simple JWT simulation (use jsonwebtoken package in production)
const generateToken = (userId: string): string => {
  return Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString(
    "base64"
  );
};

const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    return decoded;
  } catch {
    return null;
  }
};

export const handleSignup: RequestHandler<
  unknown,
  AuthResponse,
  SignupRequest
> = (req, res) => {
  const { email, firstName, lastName, phone, password, businessType, language } =
    req.body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  if (users.has(email)) {
    return res.status(400).json({
      success: false,
      message: "Email already registered",
    });
  }

  const userId = `user_${Date.now()}`;
  const newUser: User & { password: string } = {
    id: userId,
    email,
    firstName,
    lastName,
    phone,
    role: "user",
    businessType,
    language,
    createdAt: new Date().toISOString(),
    isEmailVerified: false,
    password, // In production, hash this with bcrypt
  };

  users.set(email, newUser);

  const token = generateToken(userId);
  const { password: _, ...userWithoutPassword } = newUser;

  res.status(201).json({
    success: true,
    message: "Account created successfully",
    user: userWithoutPassword,
    token,
  });
};

export const handleLogin: RequestHandler<unknown, AuthResponse, LoginRequest> =
  (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = users.get(email);
    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  };

export const handleGetProfile: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // Find user by ID
  let user = null;
  for (const u of users.values()) {
    if (u.id === decoded.userId) {
      user = u;
      break;
    }
  }

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: "Profile retrieved",
    user: userWithoutPassword,
  });
};

export const handleLogout: RequestHandler = (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

export const handleGetApplications: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  // Return applications for this user
  const userApplications = Array.from(applications.values()).filter(
    (app) => app.userId === decoded.userId
  );

  res.json({
    success: true,
    applications: userApplications,
  });
};

export const handleCreateApplication: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { serviceId, serviceName } = req.body;

  const applicationId = `app_${Date.now()}`;
  const newApplication = {
    id: applicationId,
    userId: decoded.userId,
    serviceId,
    serviceName,
    status: "draft",
    documents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paymentStatus: "pending",
    paymentAmount: 0,
    eta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  applications.set(applicationId, newApplication);

  res.status(201).json({
    success: true,
    application: newApplication,
  });
};

export const handleUploadDocument: RequestHandler = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  const { applicationId, fileName, fileType, fileUrl } = req.body;

  const application = applications.get(applicationId);
  if (!application || application.userId !== decoded.userId) {
    return res.status(404).json({ success: false, message: "Application not found" });
  }

  const documentId = `doc_${Date.now()}`;
  const newDocument = {
    id: documentId,
    applicationId,
    fileName,
    fileUrl,
    fileType,
    status: "uploaded",
    uploadedAt: new Date().toISOString(),
  };

  application.documents.push(newDocument);
  application.updatedAt = new Date().toISOString();

  res.status(201).json({
    success: true,
    document: newDocument,
  });
};
