/**
 * Token Blacklist Service
 * Manages revoked/blacklisted JWT tokens for logout functionality
 * In production, this should use Redis for distributed systems
 */

// In-memory blacklist (for development)
// In production, use Redis or another persistent store
const blacklistedTokens = new Set<string>();

// Token expiry tracking (to clean up old tokens)
const tokenExpiry = new Map<string, number>();

/**
 * Add a token to the blacklist
 * @param token - JWT token to blacklist
 * @param expiresAt - Token expiration timestamp
 */
export function blacklistToken(token: string, expiresAt?: number): void {
  blacklistedTokens.add(token);

  if (expiresAt) {
    tokenExpiry.set(token, expiresAt);
  }
}

/**
 * Check if a token is blacklisted
 * @param token - JWT token to check
 * @returns true if token is blacklisted
 */
export function isTokenBlacklisted(token: string): boolean {
  return blacklistedTokens.has(token);
}

/**
 * Remove expired tokens from the blacklist
 * Should be called periodically (e.g., via cron job)
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  const expiredTokens: string[] = [];

  tokenExpiry.forEach((expiresAt, token) => {
    if (expiresAt < now) {
      expiredTokens.push(token);
    }
  });

  expiredTokens.forEach((token) => {
    blacklistedTokens.delete(token);
    tokenExpiry.delete(token);
  });

  if (expiredTokens.length > 0) {
    console.log(`Cleaned up ${expiredTokens.length} expired tokens from blacklist`);
  }
}

/**
 * Get blacklist statistics
 */
export function getBlacklistStats() {
  return {
    totalBlacklisted: blacklistedTokens.size,
    tokensWithExpiry: tokenExpiry.size,
  };
}

/**
 * Clear all blacklisted tokens (for testing only)
 */
export function clearBlacklist(): void {
  blacklistedTokens.clear();
  tokenExpiry.clear();
}

// Cleanup expired tokens every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);
