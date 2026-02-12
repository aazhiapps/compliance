import { RequestHandler } from "express";

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and response time
 */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startTime = Date.now();
  const { method, path } = req;

  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const logLevel = statusCode >= 400 ? "ERROR" : "INFO";

    console.log(
      `[${logLevel}] ${method} ${path} - ${statusCode} - ${duration}ms`,
    );
  });

  next();
};
