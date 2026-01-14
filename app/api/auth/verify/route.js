import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/storage/database';

/**
 * GET /api/auth/verify
 * Verify authentication token validity
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Returns:
 * - valid: boolean
 * - user: User object if valid
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if session exists in database
    const db = getDatabase();
    const session = db.prepare(`
      SELECT s.*, u.username, u.device_fingerprint
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token);

    if (!session) {
      return NextResponse.json(
        { valid: false, error: 'Session expired or not found' },
        { status: 401 }
      );
    }

    // Update last access time
    db.prepare('UPDATE users SET last_access = ? WHERE id = ?')
      .run(new Date().toISOString(), session.user_id);

    return NextResponse.json({
      valid: true,
      user: {
        id: session.user_id,
        username: session.username || null,
        fingerprint: session.device_fingerprint || null
      }
    });

  } catch (error) {
    console.error('[Auth] Verify error:', error);
    return NextResponse.json(
      { valid: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
