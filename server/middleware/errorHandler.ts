import { ErrorRequestHandler } from "express";

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Global error handling middleware
 * Catches all errors and formats them consistently
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    } as ApiResponse);
  }

  // Default to 500 server error
  res.status(500).json({
    success: false,
    message: "Internal server error",
  } as ApiResponse);
};

/**
 * Helper to create success response
 */
export const successResponse = <T>(
  message: string,
  data?: T,
): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

/**
 * Helper to create error response
 */
export const errorResponse = (
  message: string,
  errors?: Array<{ field: string; message: string }>,
): ApiResponse => ({
  success: false,
  message,
  errors,
});
