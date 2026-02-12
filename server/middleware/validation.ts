import { RequestHandler } from "express";
import { z, ZodSchema } from "zod";
import { FILE_UPLOAD } from "../utils/constants";

/**
 * Middleware factory for validating request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest = <T extends ZodSchema>(
  schema: T,
): RequestHandler => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

/**
 * Common validation schemas
 */
export const schemas = {
  signup: z.object({
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(50, "First name too long"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(50, "Last name too long"),
    phone: z.string().regex(/^\+?[\d\s-()]+$/, "Invalid phone format"),
    businessType: z.enum(["individual", "startup", "company", "nonprofit"]),
    language: z.enum(["en", "hi"]),
  }),

  login: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),

  createApplication: z.object({
    serviceId: z.number().positive("Service ID must be positive"),
    serviceName: z.string().min(1, "Service name is required"),
  }),

  uploadDocument: z.object({
    applicationId: z.string().min(1, "Application ID is required"),
    fileName: z.string().min(1, "File name is required"),
    fileType: z.string().min(1, "File type is required"),
    fileUrl: z.string().min(1, "File URL is required"),
    fileSize: z
      .number()
      .positive()
      .max(FILE_UPLOAD.MAX_SIZE_BYTES, "File size must not exceed 10MB"),
  }),
};
