import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/lib/storage/database';
import { logAudit } from '@/lib/security/audit-log';

/**
 * POST /api/auth/login
 * Authenticate user with username or device fingerprint
 *
 * Request body:
 * - username (optional): Username for login
 * - fingerprint (optional): Device fingerprint for login
 *
 * Returns:
 * - token: JWT authentication token
 * - user: User object { id, username }
 */
export async function POST(request) {
  try {
    const { username, fingerprint } = await request.json();

    // Validate input
    if (!username && !fingerprint) {
      return NextResponse.json(
        { error: 'Username or device fingerprint required' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    let user;

    if (username) {
      // Username login
      user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

      if (!user) {
        // Create new user
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO users (id, username, created_at, last_access)
          VALUES (?, ?, ?, ?)
        `).run(id, username, now, now);

        user = { id, username, created_at: now, last_access: now };

        // Log user creation
        logAudit({
          userId: id,
          action: 'USER_CREATED',
          resourceType: 'user',
          resourceId: id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          details: { method: 'username' },
          success: true
        });
      }
    } else {
      // Fingerprint login
      user = db.prepare('SELECT * FROM users WHERE device_fingerprint = ?').get(fingerprint);

      if (!user) {
        // Create new user with fingerprint
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
          INSERT INTO users (id, device_fingerprint, created_at, last_access)
          VALUES (?, ?, ?, ?)
        `).run(id, fingerprint, now, now);

        user = { id, device_fingerprint: fingerprint, created_at: now, last_access: now };

        // Log user creation
        logAudit({
          userId: id,
          action: 'USER_CREATED',
          resourceType: 'user',
          resourceId: id,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          details: { method: 'fingerprint' },
          success: true
        });
      }
    }

    // Update last access time
    db.prepare('UPDATE users SET last_access = ? WHERE id = ?')
      .run(new Date().toISOString(), user.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username || null,
        fingerprint: user.device_fingerprint || null
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, user.id, token, expiresAt, new Date().toISOString());

    // Log successful login
    logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      resourceType: 'user',
      resourceId: user.id,
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
        username: user.username || null,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);

    // Log failed login attempt
    try {
      logAudit({
        userId: null,
        action: 'USER_LOGIN_FAILED',
        resourceType: 'user',
        resourceId: null,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
        details: { error: error.message },
        success: false
      });
    } catch (auditError) {
      console.error('[Auth] Audit logging failed:', auditError);
    }

    return NextResponse.json(
      { error: 'Authentication failed', details: error.message },
      { status: 500 }
    );
  }
}
