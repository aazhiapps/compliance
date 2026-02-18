import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RefreshTokenModel } from "../models/RefreshToken";
import { UserModel } from "../models/User";
import crypto from "crypto";

/**
 * Refresh Token Service
 * PHASE 1: Session Management with Token Rotation
 */

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_in_production";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days
const MAX_CONCURRENT_SESSIONS = 5; // Maximum active sessions per user

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: "Bearer";
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate refresh token (long-lived)
 */
async function generateRefreshToken(
  userId: string,
  ipAddress: string,
  userAgent: string,
  deviceId?: string,
  deviceName?: string
): Promise<string> {
  // Generate a secure random token
  const tokenValue = crypto.randomBytes(64).toString("hex");
  
  // Hash the token before storing
  const hashedToken = await bcrypt.hash(tokenValue, 10);
  
  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  
  // Check concurrent sessions and revoke oldest if limit exceeded
  const activeSessions = await RefreshTokenModel.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).sort({ issuedAt: 1 });
  
  if (activeSessions.length >= MAX_CONCURRENT_SESSIONS) {
    // Revoke oldest session
    const oldestSession = activeSessions[0];
    oldestSession.isRevoked = true;
    oldestSession.revokedAt = new Date();
    oldestSession.revokedReason = "security";
    await oldestSession.save();
  }
  
  // Store the hashed token
  await RefreshTokenModel.create({
    userId,
    token: hashedToken,
    expiresAt,
    issuedAt: new Date(),
    ipAddress,
    userAgent,
    deviceId,
    deviceName,
    isRevoked: false,
    lastUsedAt: new Date(),
    useCount: 0,
  });
  
  // Return the plain token to the user
  return tokenValue;
}

/**
 * Verify and use a refresh token
 */
async function verifyRefreshToken(
  tokenValue: string,
  ipAddress: string
): Promise<string | null> {
  try {
    // Find all non-revoked, non-expired tokens
    const tokens = await RefreshTokenModel.find({
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
    
    // Check each token by comparing hashes
    for (const token of tokens) {
      const isValid = await bcrypt.compare(tokenValue, token.token);
      
      if (isValid) {
        // Update usage stats
        token.lastUsedAt = new Date();
        token.useCount += 1;
        await token.save();
        
        return token.userId;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error verifying refresh token:", error);
    return null;
  }
}

/**
 * Rotate refresh token (issue new one and revoke old one)
 */
async function rotateRefreshToken(
  oldTokenValue: string,
  ipAddress: string,
  userAgent: string,
  deviceId?: string
): Promise<TokenPair | null> {
  try {
    // Verify the old token
    const userId = await verifyRefreshToken(oldTokenValue, ipAddress);
    
    if (!userId) {
      return null;
    }
    
    // Get user details
    const user = await UserModel.findById(userId);
    if (!user) {
      return null;
    }
    
    // Find and revoke the old token
    const tokens = await RefreshTokenModel.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
    
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(oldTokenValue, token.token);
      if (isMatch) {
        token.isRevoked = true;
        token.revokedAt = new Date();
        token.revokedReason = "replaced";
        await token.save();
        break;
      }
    }
    
    // Generate new token pair
    const tokenPair = await generateTokenPair(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      ipAddress,
      userAgent,
      deviceId
    );
    
    return tokenPair;
  } catch (error) {
    console.error("Error rotating refresh token:", error);
    return null;
  }
}

/**
 * Generate both access and refresh tokens
 */
export async function generateTokenPair(
  payload: TokenPayload,
  ipAddress: string,
  userAgent: string,
  deviceId?: string,
  deviceName?: string
): Promise<TokenPair> {
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(
    payload.userId,
    ipAddress,
    userAgent,
    deviceId,
    deviceName
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
    tokenType: "Bearer",
  };
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(
  tokenValue: string,
  reason: "logout" | "security" | "expired" | "replaced" | "admin_action" = "logout"
): Promise<boolean> {
  try {
    const tokens = await RefreshTokenModel.find({
      isRevoked: false,
    });
    
    for (const token of tokens) {
      const isMatch = await bcrypt.compare(tokenValue, token.token);
      if (isMatch) {
        token.isRevoked = true;
        token.revokedAt = new Date();
        token.revokedReason = reason;
        await token.save();
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error revoking refresh token:", error);
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(
  userId: string,
  reason: "logout" | "security" | "expired" | "replaced" | "admin_action" = "security"
): Promise<number> {
  try {
    const result = await RefreshTokenModel.updateMany(
      {
        userId,
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason,
        },
      }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error("Error revoking all user tokens:", error);
    return 0;
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserActiveSessions(userId: string) {
  try {
    const sessions = await RefreshTokenModel.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastUsedAt: -1 })
      .select("-token");
    
    return sessions;
  } catch (error) {
    console.error("Error getting user sessions:", error);
    return [];
  }
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await RefreshTokenModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    
    return result.deletedCount;
  } catch (error) {
    console.error("Error cleaning up expired tokens:", error);
    return 0;
  }
}

export default {
  generateAccessToken,
  generateTokenPair,
  verifyRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  getUserActiveSessions,
  cleanupExpiredTokens,
};
