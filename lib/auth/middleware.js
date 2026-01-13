import { verifyToken, extractTokenFromHeader } from './token.js';
import { logAudit } from '../security/audit-log.js';

/**
 * Authentication middleware for API routes
 * Verifies JWT token and attaches user to request
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    logAudit({
      action: 'AUTH_FAILED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { reason: 'No token provided' },
      success: false
    });

    return res.status(401).json({
      error: 'Authentication required',
      message: 'No authentication token provided'
    });
  }

  const payload = verifyToken(token);

  if (!payload) {
    logAudit({
      action: 'AUTH_FAILED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { reason: 'Invalid token' },
      success: false
    });

    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
    });
  }

  // Attach user to request
  req.user = {
    id: payload.userId,
    username: payload.username
  };

  req.token = token;

  next();
}

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't require it
 */
export function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = extractTokenFromHeader(authHeader);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        id: payload.userId,
        username: payload.username
      };
      req.token = token;
    }
  }

  next();
}

/**
 * Next.js API route authentication helper
 * @param {Request} request - Next.js request object
 * @returns {Object|null} - User object or null
 */
export async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.userId,
    username: payload.username
  };
}

/**
 * Require authentication for Next.js API routes
 * Returns user or throws error
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} - User object
 * @throws {Error} - If authentication fails
 */
export async function requireAuth(request) {
  const user = await authenticateRequest(request);

  if (!user) {
    logAudit({
      action: 'AUTH_REQUIRED_FAILED',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: { path: new URL(request.url).pathname },
      success: false
    });

    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Verify authentication and return response if failed
 * Usage in Next.js API routes:
 *   const authResponse = await verifyAuth(request);
 *   if (authResponse) return authResponse;
 *
 * @param {Request} request - Next.js request object
 * @returns {Promise<Response|null>} - Error response or null if authenticated
 */
export async function verifyAuth(request) {
  const user = await authenticateRequest(request);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Attach user to request for later use
  request.user = user;

  return null;
}

/**
 * Role-based authorization middleware
 * @param {Array<string>} allowedRoles - Array of allowed roles
 * @returns {Function} - Middleware function
 */
export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      logAudit({
        userId: req.user.id,
        action: 'AUTHORIZATION_FAILED',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: { requiredRoles: allowedRoles, userRole: req.user.role },
        success: false
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
}
