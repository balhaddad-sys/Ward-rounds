const rateLimits = new Map();

/**
 * Rate limiting middleware for API routes
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {Function} options.keyGenerator - Function to generate unique key per client
 * @returns {Function} - Middleware function
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60000,      // 1 minute default
    max = 60,              // 60 requests per window default
    keyGenerator = (req) => req.user?.id || req.ip || 'unknown'
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize rate limit entry for new clients
    if (!rateLimits.has(key)) {
      rateLimits.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const limit = rateLimits.get(key);

    // Reset window if time expired
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      return next();
    }

    // Check if limit exceeded
    if (limit.count >= max) {
      const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());

      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }

    // Increment count and add headers
    limit.count++;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - limit.count);
    res.setHeader('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());

    next();
  };
}

/**
 * Specific rate limit for AI endpoints (more restrictive)
 */
export const aiRateLimit = rateLimit({
  windowMs: 60000,  // 1 minute
  max: 20           // 20 AI requests per minute
});

/**
 * Specific rate limit for upload endpoints
 */
export const uploadRateLimit = rateLimit({
  windowMs: 60000,  // 1 minute
  max: 10           // 10 uploads per minute
});

/**
 * Specific rate limit for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 300000, // 5 minutes
  max: 5            // 5 login attempts per 5 minutes
});

/**
 * Clean up expired rate limit entries (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, limit] of rateLimits.entries()) {
    if (now > limit.resetTime + 60000) { // Keep for 1 minute after expiry
      rateLimits.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 300000);
}

/**
 * Get current rate limit status for a key
 * @param {string} key - Client identifier
 * @returns {Object|null} - Rate limit status or null
 */
export function getRateLimitStatus(key) {
  const limit = rateLimits.get(key);
  if (!limit) return null;

  const now = Date.now();
  return {
    count: limit.count,
    remaining: Math.max(0, 60 - limit.count),
    resetTime: limit.resetTime,
    resetIn: Math.max(0, limit.resetTime - now)
  };
}
