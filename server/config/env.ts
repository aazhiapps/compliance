import { z } from "zod";

/**
 * Environment variable schema validation
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // JWT Configuration (REQUIRED)
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for security"),

  // Server Configuration
  PORT: z.string().default("8080"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // CORS Configuration
  CORS_ORIGIN: z.string().default("*"),

  // Optional: Custom ping message
  PING_MESSAGE: z.string().optional(),
});

/**
 * Validate and parse environment variables
 * @throws {Error} if validation fails
 */
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");

      throw new Error(
        `Environment validation failed:\n${missingVars}\n\nPlease check your .env file.`,
      );
    }
    throw error;
  }
}

export type Env = z.infer<typeof envSchema>;
