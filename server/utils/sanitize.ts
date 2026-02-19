/**
 * XSS Sanitization Utilities
 * Provides server-side input sanitization to prevent XSS attacks
 */

/**
 * Simple HTML escaping for server-side string sanitization
 * This prevents XSS by escaping HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Sanitize user input by removing potentially dangerous content
 * Use this for text fields that should not contain HTML
 */
export function sanitizeInput(input: string): string {
  if (!input) return input;

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Escape remaining HTML
  return escapeHtml(sanitized);
}

/**
 * Sanitize an object's string properties
 * Recursively sanitizes all string values in an object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeInput(sanitized[key]);
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) =>
          typeof item === "string" ? sanitizeInput(item) : item,
        );
      } else {
        sanitized[key] = sanitizeObject(sanitized[key]);
      }
    }
  }

  return sanitized;
}

/**
 * List of allowed HTML tags for rich text content
 * Use this when you need to allow some HTML but want to sanitize it
 */
const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "a", "ul", "ol", "li", "h1", "h2", "h3"];

/**
 * Sanitize rich text content while preserving allowed HTML tags
 * Use this for fields that should support basic HTML formatting
 */
export function sanitizeRichText(html: string): string {
  if (!html) return html;

  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove all tags not in the allowed list
  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    return ALLOWED_TAGS.includes(tag.toLowerCase()) ? match : "";
  });

  return sanitized;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email) return email;

  // Basic email validation and sanitization
  const sanitized = email.toLowerCase().trim();

  // Remove any HTML tags
  return sanitized.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize phone numbers - remove non-numeric characters except + and spaces
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return phone;

  // Allow only numbers, +, spaces, and hyphens
  return phone.replace(/[^\d+\s-]/g, "");
}
