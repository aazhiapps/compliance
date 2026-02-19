import { useToast } from "@/hooks/use-toast";

/**
 * Standard Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  TIMEOUT: "Request timed out. Please try again.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
};

/**
 * Error Handler Utility
 * Standardized error handling across the application
 */
export class ErrorHandler {
  /**
   * Parse error and return user-friendly message
   */
  static getMessage(error: any): string {
    // Handle fetch/axios errors
    if (error.response) {
      const status = error.response.status;
      
      switch (status) {
        case 400:
          return error.response.data?.message || ERROR_MESSAGES.VALIDATION_ERROR;
        case 401:
          return ERROR_MESSAGES.UNAUTHORIZED;
        case 404:
          return ERROR_MESSAGES.NOT_FOUND;
        case 500:
          return ERROR_MESSAGES.SERVER_ERROR;
        default:
          return error.response.data?.message || ERROR_MESSAGES.UNKNOWN;
      }
    }

    // Handle network errors
    if (error.message === "Network Error" || !navigator.onLine) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Handle timeout errors
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return ERROR_MESSAGES.TIMEOUT;
    }

    // Return custom message if available
    if (error.message) {
      return error.message;
    }

    return ERROR_MESSAGES.UNKNOWN;
  }

  /**
   * Log error for debugging
   */
  static log(error: any, context?: string) {
    console.error(`[Error${context ? ` - ${context}` : ""}]:`, error);
  }
}

/**
 * useErrorHandler Hook
 * Provides consistent error handling with toast notifications
 */
export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = (error: any, context?: string) => {
    const message = ErrorHandler.getMessage(error);
    ErrorHandler.log(error, context);

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  return { handleError };
}

/**
 * Retry Logic Utility
 * Retries a failed operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: delay * 2^(attempt-1)
        const backoffDelay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  throw lastError;
}

/**
 * withErrorHandling HOF
 * Wraps an async function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler: (error: any) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  }) as T;
}
