import { RequestHandler } from "express";
import { SignupRequest, LoginRequest, AuthResponse, User } from "@shared/auth";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// In-memory storage (replace with database in production)
const users: Map<string, User & { password: string }> = new Map();
const applications: Map<string, any> = new Map();

// Seed demo data
const seedDemoUsers = async () => {
  const demoUsers: Array<User & { password: string }> = [
    {
      id: "user_demo_1",
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      phone: "+91 98765 43210",
      role: "user",
      businessType: "individual",
      language: "en",
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      password: await bcrypt.hash("Demo@1234", SALT_ROUNDS),
    },
    {
      id: "user_demo_2",
      email: "rajesh@example.com",
      firstName: "Rajesh",
      lastName: "Kumar",
      phone: "+91 98765 43211",
      role: "user",
      businessType: "startup",
      language: "en",
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      password: await bcrypt.hash("Rajesh@1234", SALT_ROUNDS),
    },
    {
      id: "user_demo_3",
      email: "priya@example.com",
      firstName: "Priya",
      lastName: "Singh",
      phone: "+91 98765 43212",
      role: "user",
      businessType: "company",
      language: "hi",
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      password: await bcrypt.hash("Priya@1234", SALT_ROUNDS),
    },
    {
      id: "admin_demo_1",
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      phone: "+91 98765 50000",
      role: "admin",
      businessType: "company",
      language: "en",
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      password: await bcrypt.hash("Admin@1234", SALT_ROUNDS),
    },
  ];

  demoUsers.forEach((user) => {
    users.set(user.email, user);
  });

  console.log("✓ Demo users seeded successfully");
};

// Seed demo data on startup
seedDemoUsers();

// Seed demo applications
const seedDemoApplications = () => {
  const demoApplications = [
    {
      id: "app_demo_1",
      userId: "user_demo_1",
      serviceId: 1,
      serviceName: "GST Registration",
      status: "approved",
      documents: [],
      createdAt: "2024-02-01T10:00:00Z",
      updatedAt: "2024-02-03T14:30:00Z",
      assignedExecutive: "Rajesh Kumar",
      paymentStatus: "paid",
      paymentAmount: 499,
      eta: "2024-02-05T00:00:00Z",
    },
    {
      id: "app_demo_2",
      userId: "user_demo_1",
      serviceId: 2,
      serviceName: "Company Registration",
      status: "under_review",
      documents: [],
      createdAt: "2024-02-04T12:00:00Z",
      updatedAt: "2024-02-04T12:00:00Z",
      assignedExecutive: "Priya Singh",
      paymentStatus: "paid",
      paymentAmount: 2999,
      eta: "2024-02-12T00:00:00Z",
    },
    {
      id: "app_demo_3",
      userId: "user_demo_2",
      serviceId: 3,
      serviceName: "PAN Registration",
      status: "submitted",
      documents: [],
      createdAt: "2024-02-05T08:30:00Z",
      updatedAt: "2024-02-05T08:30:00Z",
      paymentStatus: "pending",
      paymentAmount: 299,
      eta: "2024-02-07T00:00:00Z",
    },
  ];

  demoApplications.forEach((app) => {
    applications.set(app.id, app);
  });

  console.log("✓ Demo applications seeded successfully");
};

seedDemoApplications();

// JWT token generation and verification
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

export const handleSignup: RequestHandler<
  unknown,
  AuthResponse,
  SignupRequest
> = async (req, res) => {
  const { email, firstName, lastName, phone, password, businessType, language } =
    req.body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields",
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long",
    });
  }

  if (users.has(email)) {
    return res.status(400).json({
      success: false,
      message: "Email already registered",
    });
  }

  const userId = `user_${Date.now()}`;
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
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
    password: hashedPassword,
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
  async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
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
