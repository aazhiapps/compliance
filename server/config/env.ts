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

  // Database Configuration (REQUIRED)
  MONGODB_URI: z
    .string()
    .default("mongodb://localhost:27017/compliance")
    .describe("MongoDB connection URI"),

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
 * List of weak/insecure JWT secrets that should never be used
 */
const INSECURE_SECRETS = [
  "helloworld",
  "secret",
  "password",
  "test",
  "demo",
  "12345",
  "admin",
  "jwt_secret",
  "demo-secret-key",
];

/**
 * Validate and parse environment variables
 * @throws {Error} if validation fails
 */
export function validateEnv() {
  try {
    const env = envSchema.parse(process.env);

    // Additional security checks for JWT_SECRET
    const jwtSecretLower = env.JWT_SECRET.toLowerCase();

    // Check for insecure secrets
    for (const insecureSecret of INSECURE_SECRETS) {
      if (jwtSecretLower.includes(insecureSecret)) {
        if (env.NODE_ENV === "production") {
          throw new Error(
            `SECURITY ERROR: Insecure JWT_SECRET detected in production. ` +
              `The secret contains "${insecureSecret}" which is not allowed. ` +
              `Generate a secure secret with: openssl rand -base64 48`,
          );
        } else {
          console.warn(
            `⚠️  WARNING: Insecure JWT_SECRET detected in ${env.NODE_ENV} mode. ` +
              `The secret contains "${insecureSecret}". ` +
              `This is acceptable for development but MUST be changed for production. ` +
              `Generate a secure secret with: openssl rand -base64 48`,
          );
        }
      }
    }

    // Warn if JWT_SECRET doesn't meet recommended entropy
    if (env.JWT_SECRET.length < 48) {
      console.warn(
        `⚠️  JWT_SECRET is ${env.JWT_SECRET.length} characters. ` +
          `For maximum security, consider using 48+ characters. ` +
          `Generate with: openssl rand -base64 48`,
      );
    }

    return env;
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
