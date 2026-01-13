import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/**
 * Generate a JWT token for a user
 * @param {Object} payload - Token payload
 * @param {string} payload.userId - User ID
 * @param {string} payload.username - Username (optional)
 * @param {Object} options - JWT options
 * @returns {string} - JWT token
 */
export function generateToken(payload, options = {}) {
  const defaultOptions = {
    expiresIn: JWT_EXPIRY,
    issuer: 'medward',
    audience: 'medward-app'
  };

  return jwt.sign(payload, JWT_SECRET, { ...defaultOptions, ...options });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'medward',
      audience: 'medward-app'
    });
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return null;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null
 */
export function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Refresh a token (generate new token with updated expiry)
 * @param {string} oldToken - Existing token
 * @returns {string|null} - New token or null if invalid
 */
export function refreshToken(oldToken) {
  const payload = verifyToken(oldToken);
  if (!payload) return null;

  // Remove JWT metadata before creating new token
  const { iat, exp, iss, aud, ...userPayload } = payload;

  return generateToken(userPayload);
}

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Token or null
 */
export function extractTokenFromHeader(authHeader) {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

/**
 * Check if a token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;

  return Date.now() >= payload.exp * 1000;
}

/**
 * Get token expiry date
 * @param {string} token - JWT token
 * @returns {Date|null} - Expiry date or null
 */
export function getTokenExpiry(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;

  return new Date(payload.exp * 1000);
}
