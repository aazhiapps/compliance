/**
 * Structured logger utility for consistent logging across the application
 * Supports correlation IDs for request tracing
 */

interface LogContext {
  correlationId?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  [key: string]: any;
}

type LogLevel = "debug" | "info" | "warn" | "error";

export const createLogger = (serviceName: string) => {
  const maskSensitive = (data: any): any => {
    const sensitive = ["password", "token", "secret", "gstin", "pan", "email", "phone"];
    if (typeof data !== "object" || data === null) return data;

    const masked = { ...data };
    for (const key of sensitive) {
      if (key in masked) {
        masked[key] = "***REDACTED***";
      }
    }
    return masked;
  };

  const formatLog = (
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): string => {
    const timestamp = new Date().toISOString();
    const maskedContext = context ? maskSensitive(context) : {};

    const logObject = {
      timestamp,
      level,
      service: serviceName,
      message,
      context: maskedContext,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    return JSON.stringify(logObject);
  };

  return {
    debug: (message: string, context?: LogContext) => {
      if (process.env.NODE_ENV === "development") {
        console.log(formatLog("debug", message, context));
      }
    },

    info: (message: string, context?: LogContext) => {
      console.log(formatLog("info", message, context));
    },

    warn: (message: string, context?: LogContext) => {
      console.warn(formatLog("warn", message, context));
    },

    error: (message: string, error?: Error, context?: LogContext) => {
      console.error(formatLog("error", message, context, error));
    },
  };
};

export const logger = createLogger("GST-Compliance");

export default logger;
