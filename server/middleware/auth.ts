import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Please set it in your .env file.",
  );
}

/**
 * Extends Express Request with authenticated user information
 */
export interface AuthRequest extends Express.Request {
  userId?: string;
}

/**
 * Middleware to verify JWT token and attach userId to request
 * @throws 401 if token is missing or invalid
 */
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Generate a JWT token for a user
 * @param userId - The user ID to encode in the token
 * @param expiresIn - Token expiration time (default: 7 days)
 * @returns JWT token string
 */
export const generateToken = (
  userId: string,
  expiresIn: string | number = "7d",
): string => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
};

/**
 * Verify a JWT token
 * @param token - The JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
};
