import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { UserDB } from '@/lib/storage/database';
import { generateToken } from '@/lib/auth/token';
import { logAudit } from '@/lib/security/audit-log';
import { authRateLimit } from '@/lib/security/rate-limit';

/**
 * POST /api/auth/login
 * Login with username or device fingerprint
 */
export async function POST(request) {
  try {
    // Apply rate limiting
    // Note: In Next.js App Router, middleware works differently
    // For now, we'll skip rate limiting in route handlers

    const body = await request.json();
    const { username, fingerprint } = body;

    if (!username && !fingerprint) {
      return NextResponse.json(
        { error: 'Username or device fingerprint required' },
        { status: 400 }
      );
    }

    let user;

    if (username) {
      // Username login
      user = UserDB.findByUsername(username);

      if (!user) {
        // Create new user
        const id = uuidv4();
        UserDB.create({
          id,
          username,
          settings: {}
        });
        user = { id, username };

        logAudit({
          userId: id,
          action: 'USER_CREATED',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          details: { method: 'username' },
          success: true
        });
      }
    } else {
      // Fingerprint login
      user = UserDB.findByFingerprint(fingerprint);

      if (!user) {
        // Create new user
        const id = uuidv4();
        UserDB.create({
          id,
          deviceFingerprint: fingerprint,
          settings: {}
        });
        user = { id, deviceFingerprint: fingerprint };

        logAudit({
          userId: id,
          action: 'USER_CREATED',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          details: { method: 'fingerprint' },
          success: true
        });
      }
    }

    // Update last access
    UserDB.updateLastAccess(user.id);

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username
    });

    // Log successful login
    logAudit({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: { method: username ? 'username' : 'fingerprint' },
      success: true
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);

    logAudit({
      action: 'LOGIN_ERROR',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: { error: error.message },
      success: false,
      errorMessage: error.message
    });

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
