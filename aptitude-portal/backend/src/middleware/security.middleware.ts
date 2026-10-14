import { Request, Response, NextFunction } from 'express';

/**
 * Production Security Headers Middleware
 * Enforces strict HTTP security headers, clickjacking protection,
 * MIME-sniffing prevention, and disables framework identifiers.
 */
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Disable browser XSS auditor to avoid vulnerabilities
  res.setHeader('X-XSS-Protection', '0');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enforce HTTPS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Restrict unwanted browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');

  // Hide technology fingerprint
  res.removeHeader('X-Powered-By');

  next();
}
