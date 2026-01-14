import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'login-failures.db');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database
function getDatabase() {
  const db = new Database(DB_PATH);

  // Create table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_failures (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      category TEXT NOT NULL,
      error_message TEXT,
      error_name TEXT,
      error_stack TEXT,
      response_status INTEGER,
      response_status_text TEXT,
      request_url TEXT,
      request_method TEXT,
      timing_duration INTEGER,
      network_online INTEGER,
      network_type TEXT,
      environment_user_agent TEXT,
      environment_platform TEXT,
      user_username TEXT,
      full_data TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_timestamp ON login_failures(timestamp);
    CREATE INDEX IF NOT EXISTS idx_category ON login_failures(category);
    CREATE INDEX IF NOT EXISTS idx_username ON login_failures(user_username);
    CREATE INDEX IF NOT EXISTS idx_created_at ON login_failures(created_at);
  `);

  return db;
}

/**
 * POST /api/analytics/login-failures
 * Store a login failure record
 */
export async function POST(request) {
  try {
    const failureData = await request.json();

    // Validate required fields
    if (!failureData.id || !failureData.timestamp || !failureData.category) {
      return NextResponse.json(
        { error: 'Missing required fields: id, timestamp, category' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Insert failure record
    const stmt = db.prepare(`
      INSERT INTO login_failures (
        id, timestamp, category,
        error_message, error_name, error_stack,
        response_status, response_status_text,
        request_url, request_method,
        timing_duration,
        network_online, network_type,
        environment_user_agent, environment_platform,
        user_username,
        full_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      failureData.id,
      failureData.timestamp,
      failureData.category,
      failureData.error?.message || null,
      failureData.error?.name || null,
      failureData.error?.stack || null,
      failureData.response?.status || null,
      failureData.response?.statusText || null,
      failureData.request?.url || null,
      failureData.request?.method || null,
      failureData.timing?.duration || null,
      failureData.network?.online ? 1 : 0,
      failureData.network?.effectiveType || null,
      failureData.environment?.userAgent || null,
      failureData.environment?.platform || null,
      failureData.user?.username || null,
      JSON.stringify(failureData)
    );

    db.close();

    console.log('[LoginFailures] Stored failure:', failureData.id);

    return NextResponse.json(
      { success: true, id: failureData.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('[LoginFailures] Error storing failure:', error);
    return NextResponse.json(
      { error: 'Failed to store failure record', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/login-failures
 * Retrieve login failure records with optional filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const since = searchParams.get('since'); // ISO timestamp
    const username = searchParams.get('username');

    const db = getDatabase();

    // Build query
    let query = 'SELECT * FROM login_failures WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (since) {
      query += ' AND timestamp >= ?';
      params.push(since);
    }

    if (username) {
      query += ' AND user_username = ?';
      params.push(username);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM login_failures WHERE 1=1';
    const countParams = [];

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    if (since) {
      countQuery += ' AND timestamp >= ?';
      countParams.push(since);
    }

    if (username) {
      countQuery += ' AND user_username = ?';
      countParams.push(username);
    }

    const countStmt = db.prepare(countQuery);
    const { total } = countStmt.get(...countParams);

    // Parse full_data for each row
    const failures = rows.map(row => {
      try {
        return JSON.parse(row.full_data);
      } catch (e) {
        console.error('[LoginFailures] Failed to parse full_data for:', row.id);
        return null;
      }
    }).filter(Boolean);

    db.close();

    return NextResponse.json({
      success: true,
      data: failures,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('[LoginFailures] Error retrieving failures:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve failure records', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/login-failures
 * Delete old failure records (cleanup)
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan'); // ISO timestamp
    const all = searchParams.get('all') === 'true';

    const db = getDatabase();

    let stmt;
    let deleted;

    if (all) {
      stmt = db.prepare('DELETE FROM login_failures');
      const result = stmt.run();
      deleted = result.changes;
    } else if (olderThan) {
      stmt = db.prepare('DELETE FROM login_failures WHERE timestamp < ?');
      const result = stmt.run(olderThan);
      deleted = result.changes;
    } else {
      db.close();
      return NextResponse.json(
        { error: 'Must specify either "all=true" or "olderThan" parameter' },
        { status: 400 }
      );
    }

    // Vacuum to reclaim space
    db.exec('VACUUM');

    db.close();

    console.log('[LoginFailures] Deleted', deleted, 'failure records');

    return NextResponse.json({
      success: true,
      deleted
    });
  } catch (error) {
    console.error('[LoginFailures] Error deleting failures:', error);
    return NextResponse.json(
      { error: 'Failed to delete failure records', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/analytics/login-failures/stats
 * Get statistics about login failures
 */
export async function PATCH(request) {
  try {
    const db = getDatabase();

    // Total failures
    const totalStmt = db.prepare('SELECT COUNT(*) as total FROM login_failures');
    const { total } = totalStmt.get();

    // By category
    const categoryStmt = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM login_failures
      GROUP BY category
      ORDER BY count DESC
    `);
    const byCategory = categoryStmt.all();

    // Last 24 hours
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const last24Stmt = db.prepare(
      'SELECT COUNT(*) as count FROM login_failures WHERE timestamp >= ?'
    );
    const { count: last24Hours } = last24Stmt.get(yesterday);

    // Last hour
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const lastHourStmt = db.prepare(
      'SELECT COUNT(*) as count FROM login_failures WHERE timestamp >= ?'
    );
    const { count: lastHour } = lastHourStmt.get(hourAgo);

    // Average duration
    const avgDurationStmt = db.prepare(
      'SELECT AVG(timing_duration) as avg FROM login_failures WHERE timing_duration IS NOT NULL'
    );
    const { avg: avgDuration } = avgDurationStmt.get();

    // Most common errors
    const topErrorsStmt = db.prepare(`
      SELECT error_message, COUNT(*) as count
      FROM login_failures
      WHERE error_message IS NOT NULL
      GROUP BY error_message
      ORDER BY count DESC
      LIMIT 5
    `);
    const topErrors = topErrorsStmt.all();

    // Date range
    const dateRangeStmt = db.prepare(`
      SELECT
        MIN(timestamp) as first,
        MAX(timestamp) as last
      FROM login_failures
    `);
    const dateRange = dateRangeStmt.get();

    db.close();

    return NextResponse.json({
      success: true,
      statistics: {
        total,
        byCategory: byCategory.reduce((acc, { category, count }) => {
          acc[category] = count;
          return acc;
        }, {}),
        last24Hours,
        lastHour,
        avgDuration: avgDuration ? Math.round(avgDuration) : 0,
        topErrors: topErrors.map(e => ({
          message: e.error_message,
          count: e.count
        })),
        dateRange
      }
    });
  } catch (error) {
    console.error('[LoginFailures] Error getting statistics:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics', details: error.message },
      { status: 500 }
    );
  }
}
