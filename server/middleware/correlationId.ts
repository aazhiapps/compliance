import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Correlation ID middleware
 * Generates unique ID for each request to trace through logs and system
 * Useful for debugging production issues and understanding request flow
 */

// Extend Express Request type to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Try to get existing correlation ID from header (if request came from another service)
  const existingId = req.headers["x-correlation-id"] as string;

  // Use existing ID or generate new one
  const correlationId = existingId || uuidv4();

  // Attach to request object
  req.correlationId = correlationId;

  // Set response header so client can reference it
  res.setHeader("X-Correlation-ID", correlationId);

  // Add correlation ID to response locals for logging
  res.locals.correlationId = correlationId;

  next();
};

/**
 * Helper to get correlation ID from request context
 */
export const getCorrelationId = (req: Request): string => {
  return req.correlationId || "unknown";
};

export default correlationIdMiddleware;
