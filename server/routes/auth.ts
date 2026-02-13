import { RequestHandler } from "express";
import { SignupRequest, LoginRequest, AuthResponse, User, Application } from "@shared/auth";
import bcrypt from "bcrypt";
import { generateToken } from "../middleware/auth";
import { userRepository } from "../repositories/userRepository";
import { applicationRepository } from "../repositories/applicationRepository";
import { AUTH, HTTP_STATUS } from "../utils/constants";
import { AuthRequest } from "../middleware/auth";

/**
 * Seed demo users for development/testing
 * WARNING: Remove or disable in production
 */
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
      password: await bcrypt.hash("Demo@1234", AUTH.SALT_ROUNDS),
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
      password: await bcrypt.hash("Rajesh@1234", AUTH.SALT_ROUNDS),
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
      password: await bcrypt.hash("Priya@1234", AUTH.SALT_ROUNDS),
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
      password: await bcrypt.hash("Admin@1234", AUTH.SALT_ROUNDS),
    },
    {
      id: "staff_demo_1",
      email: "staff@example.com",
      firstName: "Staff",
      lastName: "Member",
      phone: "+91 98765 60000",
      role: "staff",
      businessType: "company",
      language: "en",
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      password: await bcrypt.hash("Staff@1234", AUTH.SALT_ROUNDS),
    },
    {
      id: "staff_demo_2",
      email: "sarah@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      phone: "+91 98765 60001",
      role: "staff",
      businessType: "company",
      language: "en",
      createdAt: new Date().toISOString(),
      isEmailVerified: true,
      password: await bcrypt.hash("Sarah@1234", AUTH.SALT_ROUNDS),
    },
  ];

  demoUsers.forEach((user) => {
    userRepository.create(user);
  });

  console.log("✓ Demo users seeded successfully");
};

// Seed demo data on startup
seedDemoUsers();

/**
 * Seed demo applications for development/testing
 * WARNING: Remove or disable in production
 */
const seedDemoApplications = () => {
  const demoApplications: Application[] = [
    {
      id: "app_demo_1",
      userId: "user_demo_1",
      serviceId: 1,
      serviceName: "GST Registration",
      status: "approved",
      documents: [
        {
          id: "doc_demo_1",
          applicationId: "app_demo_1",
          fileName: "PAN_Card.pdf",
          fileUrl: "data:application/pdf;base64,demo",
          fileType: "application/pdf",
          fileSize: 245678,
          status: "approved",
          uploadedAt: "2024-02-01T11:00:00Z",
        },
        {
          id: "doc_demo_2",
          applicationId: "app_demo_1",
          fileName: "Aadhar_Card.pdf",
          fileUrl: "data:application/pdf;base64,demo",
          fileType: "application/pdf",
          fileSize: 189234,
          status: "approved",
          uploadedAt: "2024-02-01T11:30:00Z",
        },
        {
          id: "doc_demo_3",
          applicationId: "app_demo_1",
          fileName: "Business_Address_Proof.pdf",
          fileUrl: "data:application/pdf;base64,demo",
          fileType: "application/pdf",
          fileSize: 312456,
          status: "approved",
          uploadedAt: "2024-02-02T09:00:00Z",
        },
      ],
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
      documents: [
        {
          id: "doc_demo_4",
          applicationId: "app_demo_2",
          fileName: "MOA_AOA.pdf",
          fileUrl: "data:application/pdf;base64,demo",
          fileType: "application/pdf",
          fileSize: 456789,
          status: "verifying",
          uploadedAt: "2024-02-04T13:00:00Z",
        },
        {
          id: "doc_demo_5",
          applicationId: "app_demo_2",
          fileName: "Director_ID_Proof.pdf",
          fileUrl: "data:application/pdf;base64,demo",
          fileType: "application/pdf",
          fileSize: 234567,
          status: "approved",
          uploadedAt: "2024-02-04T13:30:00Z",
        },
      ],
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
      documents: [
        {
          id: "doc_demo_6",
          applicationId: "app_demo_3",
          fileName: "Photo.jpg",
          fileUrl: "data:image/jpeg;base64,demo",
          fileType: "image/jpeg",
          fileSize: 123456,
          status: "uploaded",
          uploadedAt: "2024-02-05T09:00:00Z",
        },
      ],
      createdAt: "2024-02-05T08:30:00Z",
      updatedAt: "2024-02-05T08:30:00Z",
      paymentStatus: "pending",
      paymentAmount: 299,
      eta: "2024-02-07T00:00:00Z",
    },
  ];

  demoApplications.forEach((app) => {
    applicationRepository.create(app);
  });

  console.log("✓ Demo applications seeded successfully");
};

seedDemoApplications();

/**
 * Handle user signup
 * Creates a new user account with validation
 */
export const handleSignup: RequestHandler<
  unknown,
  AuthResponse,
  SignupRequest
> = async (req, res) => {
  const { email, firstName, lastName, phone, password, businessType, language } =
    req.body;

  // Check if user already exists
  if (userRepository.exists(email)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Email already registered",
    });
  }

  const userId = `user_${Date.now()}`;
  const hashedPassword = await bcrypt.hash(password, AUTH.SALT_ROUNDS);
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

  userRepository.create(newUser);

  const token = generateToken(userId);
  const { password: _, ...userWithoutPassword } = newUser;

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "Account created successfully",
    user: userWithoutPassword,
    token,
  });
};

/**
 * Handle user login
 * Authenticates user with email and password
 */
export const handleLogin: RequestHandler<unknown, AuthResponse, LoginRequest> =
  async (req, res) => {
    const { email, password } = req.body;

    const user = userRepository.findByEmail(email);
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
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

/**
 * Get authenticated user profile
 * Requires authentication middleware
 */
export const handleGetProfile: RequestHandler = (req, res) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  const user = userRepository.findById(userId);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
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

/**
 * Handle user logout
 * Note: JWT is stateless, so this is just a confirmation
 */
export const handleLogout: RequestHandler = (_req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

/**
 * Get applications for authenticated user
 * Requires authentication middleware
 */
export const handleGetApplications: RequestHandler = (req, res) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  const userApplications = applicationRepository.findByUserId(userId);

  res.json({
    success: true,
    applications: userApplications,
  });
};

/**
 * Create a new application
 * Requires authentication middleware
 */
export const handleCreateApplication: RequestHandler = (req, res) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  const { serviceId, serviceName } = req.body;

  const applicationId = `app_${Date.now()}`;
  const newApplication: Application = {
    id: applicationId,
    userId,
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

  applicationRepository.create(newApplication);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    application: newApplication,
  });
};

/**
 * Upload a document to an application
 * Requires authentication middleware
 */
export const handleUploadDocument: RequestHandler = (req, res) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  const { applicationId, fileName, fileType, fileUrl } = req.body;

  const application = applicationRepository.findById(applicationId);
  if (!application || application.userId !== userId) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Application not found",
    });
  }

  const documentId = `doc_${Date.now()}`;
  const newDocument = {
    id: documentId,
    applicationId,
    fileName,
    fileUrl,
    fileType,
    status: "uploaded" as const,
    uploadedAt: new Date().toISOString(),
  };

  applicationRepository.addDocument(applicationId, newDocument);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    document: newDocument,
  });
};

/**
 * Get all documents for authenticated user grouped by service
 * Requires authentication middleware
 */
export const handleGetUserDocuments: RequestHandler = (req, res) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  const userApplications = applicationRepository.findByUserId(userId);

  // Group documents by service
  const serviceDocsMap = new Map<
    number,
    {
      serviceId: number;
      serviceName: string;
      documents: Application["documents"];
      applicationIds: string[];
    }
  >();

  userApplications.forEach((app) => {
    if (!serviceDocsMap.has(app.serviceId)) {
      serviceDocsMap.set(app.serviceId, {
        serviceId: app.serviceId,
        serviceName: app.serviceName,
        documents: [],
        applicationIds: [],
      });
    }

    const serviceDoc = serviceDocsMap.get(app.serviceId)!;
    serviceDoc.applicationIds.push(app.id);

    // Add all documents from this application
    if (app.documents && app.documents.length > 0) {
      serviceDoc.documents.push(...app.documents);
    }
  });

  const services = Array.from(serviceDocsMap.values());

  res.json({
    success: true,
    services,
  });
};
