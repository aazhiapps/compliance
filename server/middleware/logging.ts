import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Request logging middleware with correlation ID tracking
 * Logs all incoming requests with method, path, response time, and correlation ID
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startTime = Date.now();
  const { method, path } = req;

  // Add correlation ID if not present
  const correlationId = req.headers["x-correlation-id"] as string || uuidv4();
  (req as any).correlationId = correlationId;

  // Set correlation ID in response header
  res.setHeader("X-Correlation-ID", correlationId);

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const logLevel = statusCode >= 400 ? "ERROR" : "INFO";

    // Enhanced logging with correlation ID
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: logLevel,
        method,
        path,
        statusCode,
        duration: `${duration}ms`,
        correlationId,
      })
    );
  });

  next();
};
