# Architecture & Coding Standards

This document outlines the architecture decisions and coding standards implemented in this application.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Middleware Layer](#middleware-layer)
- [Security Features](#security-features)
- [Code Quality Standards](#code-quality-standards)
- [Environment Configuration](#environment-configuration)
- [Best Practices](#best-practices)

## Architecture Overview

### Server-Side Architecture

```
server/
├── config/           # Configuration files
│   └── env.ts        # Environment variable validation
├── middleware/       # Express middleware
│   ├── auth.ts       # Authentication & JWT handling
│   ├── validation.ts # Request validation with Zod
│   ├── errorHandler.ts # Global error handling
│   ├── logging.ts    # Request logging
│   └── rateLimiter.ts # Rate limiting
├── repositories/     # Data access layer
│   ├── userRepository.ts
│   └── applicationRepository.ts
├── routes/          # Route handlers
│   ├── auth.ts
│   └── demo.ts
├── utils/           # Utility functions
│   └── constants.ts # Application constants
└── index.ts         # Server setup
```

### Key Architectural Decisions

1. **Separation of Concerns**
   - Middleware layer for cross-cutting concerns
   - Repository pattern for data access
   - Route handlers focus only on HTTP concerns

2. **Type Safety**
   - TypeScript strict mode enabled
   - All functions properly typed
   - No `any` types allowed

3. **Validation**
   - Zod schemas for request validation
   - Environment variable validation on startup
   - Input sanitization built-in

## Middleware Layer

### Authentication Middleware

Located in `server/middleware/auth.ts`:

```typescript
// Protects routes requiring authentication
app.get("/api/profile", authenticateToken, handleGetProfile);
```

Features:

- JWT token verification
- Automatic token expiration handling
- User ID injection into request object

### Validation Middleware

Located in `server/middleware/validation.ts`:

```typescript
// Validates request body against schema
app.post("/api/auth/signup", validateRequest(schemas.signup), handleSignup);
```

Features:

- Zod schema validation
- Detailed error messages
- Built-in type safety

### Error Handler

Located in `server/middleware/errorHandler.ts`:

```typescript
// Must be registered last
app.use(errorHandler);
```

Features:

- Standardized error responses
- Error logging
- Development vs production error details

### Request Logger

Located in `server/middleware/logging.ts`:

Features:

- Logs all requests with timing
- Color-coded by status
- Production-ready logging format

## Security Features

### 1. Environment Variable Validation

**File:** `server/config/env.ts`

The application validates all required environment variables on startup:

```typescript
// Required variables
JWT_SECRET: min 32 characters
PORT: default 8080
NODE_ENV: development|production|test
CORS_ORIGIN: default "*"
```

### 2. JWT Authentication

**File:** `server/middleware/auth.ts`

- Requires JWT_SECRET to be set (crashes if missing)
- Default JWT_SECRET only works for development
- Tokens expire after 7 days
- Validates token signature and expiration

### 3. Request Validation

**File:** `server/middleware/validation.ts`

All input is validated using Zod schemas:

- Email format validation
- Password complexity requirements
- File size limits (10MB max)
- Phone number format validation

### 4. CORS Configuration

**File:** `server/index.ts`

```typescript
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
);
```

### 5. Rate Limiting

**File:** `server/middleware/rateLimiter.ts`

Three levels of rate limiting:

1. **General API Limiter** - 100 requests per 15 minutes for all API routes
2. **Auth Limiter** - 5 attempts per 15 minutes for login/signup (prevents brute force)
3. **File Limiter** - 20 file operations per hour (prevents abuse)

```typescript
// Authentication routes
app.post(
  "/api/auth/login",
  authLimiter,
  validateRequest(schemas.login),
  handleLogin,
);

// File upload routes
app.post(
  "/api/documents",
  authenticateToken,
  fileLimiter,
  handleUploadDocument,
);
```

### 6. Input Sanitization

All user input is validated and sanitized through Zod schemas before processing.

## Code Quality Standards

### TypeScript Configuration

**File:** `tsconfig.json`

Strict mode is enabled with all checks:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitAny": true,
  "noFallthroughCasesInSwitch": true,
  "strictNullChecks": true
}
```

### Documentation Standards

All public functions include JSDoc comments:

```typescript
/**
 * Generate a JWT token for a user
 * @param userId - The user ID to encode in the token
 * @param expiresIn - Token expiration time (default: 7 days)
 * @returns JWT token string
 */
export const generateToken = (userId: string, expiresIn = "7d"): string => {
  // ...
};
```

### Constants

**File:** `server/utils/constants.ts`

All magic values are extracted to constants:

```typescript
export const AUTH = {
  SALT_ROUNDS: 10,
  TOKEN_EXPIRY: "7d",
  PASSWORD_MIN_LENGTH: 8,
} as const;
```

### Error Handling

All errors are handled consistently:

```typescript
// Use ApiError for business logic errors
throw new ApiError(404, "User not found");

// Global error handler catches all errors
app.use(errorHandler);
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file with:

```bash
# JWT Secret - REQUIRED (minimum 32 characters)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-secure-secret-key-here-min-32-characters

# Server Configuration
PORT=8080
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*

# Optional
PING_MESSAGE="pong"
```

### Environment Variable Validation

The application validates environment variables on startup:

```typescript
// In server/node-build.ts
import { validateEnv } from "./config/env";
validateEnv(); // Throws error if validation fails
```

## Best Practices

### 1. Always Use Middleware

✅ **Good:**

```typescript
app.get("/api/profile", authenticateToken, handleGetProfile);
```

❌ **Bad:**

```typescript
// Don't manually verify tokens in every handler
app.get("/api/profile", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({...});
  // ...
});
```

### 2. Use Validation Schemas

✅ **Good:**

```typescript
app.post("/api/signup", validateRequest(schemas.signup), handleSignup);
```

❌ **Bad:**

```typescript
// Don't manually validate in handlers
app.post("/api/signup", (req, res) => {
  if (!req.body.email) return res.status(400).json({...});
  if (!/\S+@\S+/.test(req.body.email)) return res.status(400).json({...});
  // ...
});
```

### 3. Use Repository Pattern

✅ **Good:**

```typescript
const user = userRepository.findByEmail(email);
```

❌ **Bad:**

```typescript
// Don't access data storage directly
const user = users.get(email);
```

### 4. Use Constants

✅ **Good:**

```typescript
import { AUTH, HTTP_STATUS } from "../utils/constants";
await bcrypt.hash(password, AUTH.SALT_ROUNDS);
return res.status(HTTP_STATUS.UNAUTHORIZED).json({...});
```

❌ **Bad:**

```typescript
// Don't use magic values
await bcrypt.hash(password, 10);
return res.status(401).json({...});
```

### 5. Handle Errors Properly

✅ **Good:**

```typescript
try {
  // ... code that might fail
} catch (error) {
  throw new ApiError(500, "Failed to process request");
}
```

❌ **Bad:**

```typescript
// Don't swallow errors
try {
  // ... code that might fail
} catch (error) {
  console.log(error);
}
```

## Testing

### Type Checking

```bash
npm run typecheck
```

All code must pass TypeScript strict mode checks.

### Building

```bash
npm run build
```

Both client and server must build without errors.

### Running

```bash
npm run dev    # Development mode with hot reload
npm start      # Production mode
```

## Future Improvements

Potential enhancements for production deployment:

1. **Database Integration**
   - Replace in-memory repositories with actual database
   - Add migration system
   - Implement connection pooling

2. **Rate Limiting**
   - Add rate limiting middleware
   - Protect against brute force attacks

3. **Monitoring**
   - Add structured logging (e.g., Winston, Pino)
   - Integrate APM tools
   - Add health check endpoints

4. **Testing**
   - Add unit tests for middleware
   - Add integration tests for API endpoints
   - Add E2E tests for critical flows

5. **Security Enhancements**
   - Implement refresh tokens
   - Add CSRF protection
   - Implement rate limiting per user
   - Add password reset flow with email verification

6. **Performance**
   - Add Redis for caching
   - Implement database query optimization
   - Add CDN for static assets

## Contributing

When adding new features:

1. Follow the existing architecture patterns
2. Add appropriate middleware
3. Use Zod for validation
4. Add JSDoc comments
5. Update this documentation
6. Ensure TypeScript strict mode compliance
