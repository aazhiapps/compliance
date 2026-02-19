import { Request, Response, NextFunction } from "express";
import { sanitizeObject } from "../utils/sanitize";

/**
 * Middleware to sanitize request body to prevent XSS attacks
 * This should be applied after body parsing middleware
 */
export function sanitizeRequestBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Middleware to sanitize query parameters
 */
export function sanitizeQueryParams(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query as Record<string, any>);
  }
  next();
}

/**
 * Combined sanitization middleware
 * Sanitizes both body and query parameters
 */
export function sanitizeRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  sanitizeRequestBody(req, res, () => {
    sanitizeQueryParams(req, res, next);
  });
}
