import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Applies to all API routes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for authentication routes
 * Helps prevent brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/signup attempts per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message:
      "Too many authentication attempts, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file operations
 * Prevents abuse of file upload/download endpoints
 */
export const fileLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 file operations per hour
  message: {
    success: false,
    message: "Too many file operations, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
