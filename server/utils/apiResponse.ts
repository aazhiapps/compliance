import { Response } from "express";
import { ErrorCode } from "@shared/compliance";

/**
 * API Response Utilities
 * PHASE 1: Standardized Error Handling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  errors?: {
    field?: string;
    message: string;
    code?: string;
  }[];
  metadata?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
    [key: string]: any;
  };
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  metadata?: any,
  statusCode: number = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    metadata,
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  errorCode?: ErrorCode | string,
  errors?: Array<{ field?: string; message: string; code?: string }>,
  statusCode: number = 400
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    errorCode,
    errors,
  };
  
  return res.status(statusCode).json(response);
}

/**
 * Send validation error response
 */
export function sendValidationError(
  res: Response,
  errors: Array<{ field?: string; message: string; code?: string }>
): Response {
  return sendError(
    res,
    "Validation failed",
    ErrorCode.VALIDATION_REQUIRED_FIELD,
    errors,
    400
  );
}

/**
 * Send unauthorized error
 */
export function sendUnauthorized(
  res: Response,
  message: string = "Authentication required"
): Response {
  return sendError(
    res,
    message,
    ErrorCode.AUTH_TOKEN_INVALID,
    undefined,
    401
  );
}

/**
 * Send forbidden error
 */
export function sendForbidden(
  res: Response,
  message: string = "Permission denied"
): Response {
  return sendError(
    res,
    message,
    ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
    undefined,
    403
  );
}

/**
 * Send not found error
 */
export function sendNotFound(
  res: Response,
  resource: string = "Resource"
): Response {
  return sendError(
    res,
    `${resource} not found`,
    undefined,
    undefined,
    404
  );
}

/**
 * Send internal server error
 */
export function sendInternalError(
  res: Response,
  message: string = "Internal server error"
): Response {
  return sendError(
    res,
    message,
    ErrorCode.SYSTEM_INTERNAL_ERROR,
    undefined,
    500
  );
}

/**
 * Send paginated response
 */
export function sendPaginatedSuccess<T>(
  res: Response,
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  message?: string
): Response {
  const hasMore = page * pageSize < total;
  
  return sendSuccess(
    res,
    data,
    message,
    {
      page,
      pageSize,
      total,
      hasMore,
      totalPages: Math.ceil(total / pageSize),
    }
  );
}

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: any, res: Response, next: any) => Promise<any>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("Async handler error:", error);
      
      // Check if it's a validation error
      if (error.name === "ValidationError") {
        const errors = Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        }));
        
        return sendValidationError(res, errors);
      }
      
      // Check if it's a MongoDB duplicate key error
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        return sendError(
          res,
          `${field} already exists`,
          ErrorCode.VALIDATION_DUPLICATE_ENTRY,
          [{ field, message: "Already exists" }],
          409
        );
      }
      
      // Generic error
      return sendInternalError(res, error.message);
    });
  };
}

/**
 * Create a standardized error object
 */
export function createError(
  message: string,
  code?: ErrorCode | string,
  statusCode?: number
): Error & { code?: string; statusCode?: number } {
  const error: any = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

export default {
  sendSuccess,
  sendError,
  sendValidationError,
  sendUnauthorized,
  sendForbidden,
  sendNotFound,
  sendInternalError,
  sendPaginatedSuccess,
  asyncHandler,
  createError,
};
