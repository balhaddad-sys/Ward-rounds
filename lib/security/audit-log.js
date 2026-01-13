import Database from 'better-sqlite3';
import path from 'path';

let auditDb = null;

/**
 * Initialize audit log database
 */
function getAuditDb() {
  if (auditDb) return auditDb;

  const dbPath = process.env.AUDIT_DB_PATH || path.join(process.cwd(), 'data', 'audit.db');
  auditDb = new Database(dbPath);

  // Create audit_log table if not exists
  auditDb.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      success BOOLEAN,
      error_message TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);
  `);

  return auditDb;
}

/**
 * Log an audit event
 * @param {Object} event - Audit event details
 * @param {string} event.userId - User ID performing the action
 * @param {string} event.action - Action performed (e.g., 'UPLOAD_REPORT', 'VIEW_PATIENT')
 * @param {string} event.resourceType - Type of resource (e.g., 'patient', 'report')
 * @param {string} event.resourceId - ID of the resource
 * @param {string} event.ipAddress - Client IP address
 * @param {string} event.userAgent - Client user agent
 * @param {Object} event.details - Additional details
 * @param {boolean} event.success - Whether the action succeeded
 * @param {string} event.errorMessage - Error message if failed
 */
export function logAudit(event) {
  try {
    const db = getAuditDb();
    const stmt = db.prepare(`
      INSERT INTO audit_log
      (user_id, action, resource_type, resource_id, ip_address, user_agent, details, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.userId || null,
      event.action,
      event.resourceType || null,
      event.resourceId || null,
      event.ipAddress || null,
      event.userAgent || null,
      event.details ? JSON.stringify(event.details) : null,
      event.success ? 1 : 0,
      event.errorMessage || null
    );
  } catch (error) {
    console.error('[Audit Log] Failed to log event:', error);
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Express/Next.js middleware for automatic audit logging
 * @param {string} action - Action name
 * @param {string} resourceType - Resource type
 * @returns {Function} - Middleware function
 */
export function auditMiddleware(action, resourceType) {
  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    // Intercept response to log after completion
    const logResponse = function (body) {
      logAudit({
        userId: req.user?.id,
        action,
        resourceType,
        resourceId: req.params?.id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        details: {
          method: req.method,
          path: req.path,
          query: req.query,
          statusCode: res.statusCode
        },
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? (typeof body === 'object' ? body.error : body) : null
      });
    };

    res.send = function (body) {
      logResponse(body);
      return originalSend.call(this, body);
    };

    res.json = function (body) {
      logResponse(body);
      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Query audit logs
 * @param {Object} filters - Query filters
 * @param {string} filters.userId - Filter by user ID
 * @param {string} filters.action - Filter by action
 * @param {string} filters.resourceType - Filter by resource type
 * @param {string} filters.startDate - Start date (ISO string)
 * @param {string} filters.endDate - End date (ISO string)
 * @param {number} filters.limit - Maximum number of results
 * @param {number} filters.offset - Offset for pagination
 * @returns {Array} - Array of audit log entries
 */
export function queryAuditLogs(filters = {}) {
  const db = getAuditDb();
  let query = 'SELECT * FROM audit_log WHERE 1=1';
  const params = [];

  if (filters.userId) {
    query += ' AND user_id = ?';
    params.push(filters.userId);
  }

  if (filters.action) {
    query += ' AND action = ?';
    params.push(filters.action);
  }

  if (filters.resourceType) {
    query += ' AND resource_type = ?';
    params.push(filters.resourceType);
  }

  if (filters.startDate) {
    query += ' AND timestamp >= ?';
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    query += ' AND timestamp <= ?';
    params.push(filters.endDate);
  }

  query += ' ORDER BY timestamp DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  if (filters.offset) {
    query += ' OFFSET ?';
    params.push(filters.offset);
  }

  const stmt = db.prepare(query);
  const results = stmt.all(...params);

  // Parse JSON details
  return results.map(row => ({
    ...row,
    details: row.details ? JSON.parse(row.details) : null,
    success: Boolean(row.success)
  }));
}

/**
 * Get audit statistics
 * @param {string} userId - Optional user ID to filter by
 * @returns {Object} - Audit statistics
 */
export function getAuditStats(userId = null) {
  const db = getAuditDb();

  const whereClause = userId ? 'WHERE user_id = ?' : '';
  const params = userId ? [userId] : [];

  const totalQuery = db.prepare(`SELECT COUNT(*) as total FROM audit_log ${whereClause}`);
  const successQuery = db.prepare(`SELECT COUNT(*) as total FROM audit_log ${whereClause} ${userId ? 'AND' : 'WHERE'} success = 1`);
  const failureQuery = db.prepare(`SELECT COUNT(*) as total FROM audit_log ${whereClause} ${userId ? 'AND' : 'WHERE'} success = 0`);
  const actionQuery = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM audit_log ${whereClause}
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  `);

  return {
    total: totalQuery.get(...params).total,
    successful: successQuery.get(...params).total,
    failed: failureQuery.get(...params).total,
    topActions: actionQuery.all(...params)
  };
}

/**
 * Clean up old audit logs (retention policy)
 * @param {number} daysToKeep - Number of days to keep logs (default 90)
 */
export function cleanupOldLogs(daysToKeep = 90) {
  const db = getAuditDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const stmt = db.prepare('DELETE FROM audit_log WHERE timestamp < ?');
  const result = stmt.run(cutoffDate.toISOString());

  console.log(`[Audit Log] Cleaned up ${result.changes} old log entries`);
  return result.changes;
}
