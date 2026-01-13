import Database from 'better-sqlite3';
import path from 'path';

let db = null;
let knowledgeDb = null;

/**
 * Get the main application database instance
 * @returns {Database} - SQLite database instance
 */
export function getDatabase() {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'medward.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Get the knowledge base database instance
 * @returns {Database} - SQLite database instance
 */
export function getKnowledgeDatabase() {
  if (knowledgeDb) return knowledgeDb;

  const dbPath = process.env.KNOWLEDGE_DB_PATH || path.join(process.cwd(), 'data', 'knowledge.db');
  knowledgeDb = new Database(dbPath);
  knowledgeDb.pragma('journal_mode = WAL');

  return knowledgeDb;
}

/**
 * Close all database connections
 */
export function closeDatabases() {
  if (db) {
    db.close();
    db = null;
  }
  if (knowledgeDb) {
    knowledgeDb.close();
    knowledgeDb = null;
  }
}

/**
 * User database operations
 */
export const UserDB = {
  create(user) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO users (id, username, device_fingerprint, google_drive_folder_id, settings)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      user.id,
      user.username || null,
      user.deviceFingerprint || null,
      user.googleDriveFolderId || null,
      JSON.stringify(user.settings || {})
    );
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id);
    if (user) {
      user.settings = JSON.parse(user.settings || '{}');
    }
    return user;
  },

  findByUsername(username) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    if (user) {
      user.settings = JSON.parse(user.settings || '{}');
    }
    return user;
  },

  findByFingerprint(fingerprint) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE device_fingerprint = ?');
    const user = stmt.get(fingerprint);
    if (user) {
      user.settings = JSON.parse(user.settings || '{}');
    }
    return user;
  },

  updateLastAccess(userId) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE users SET last_access = ? WHERE id = ?');
    return stmt.run(new Date().toISOString(), userId);
  },

  update(userId, updates) {
    const db = getDatabase();
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }

    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values, userId);
  }
};

/**
 * Patient database operations
 */
export const PatientDB = {
  create(patient) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO patients (id, user_id, mrn, name, age, gender, admission_date, chief_complaint, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      patient.id,
      patient.userId,
      patient.mrn,
      patient.name || null,
      patient.age || null,
      patient.gender || null,
      patient.admissionDate || null,
      patient.chiefComplaint || null,
      patient.status || 'stable',
      JSON.stringify(patient.metadata || {})
    );
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM patients WHERE id = ?');
    const patient = stmt.get(id);
    if (patient) {
      patient.metadata = JSON.parse(patient.metadata || '{}');
    }
    return patient;
  },

  findByUserId(userId, limit = 100, offset = 0) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM patients
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `);
    const patients = stmt.all(userId, limit, offset);
    return patients.map(p => ({
      ...p,
      metadata: JSON.parse(p.metadata || '{}')
    }));
  },

  update(patientId, updates) {
    const db = getDatabase();
    const fields = ['updated_at = ?'];
    const values = [new Date().toISOString()];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(typeof value === 'object' ? JSON.stringify(value) : value);
    }

    const stmt = db.prepare(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values, patientId);
  },

  delete(patientId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
    return stmt.run(patientId);
  }
};

/**
 * Report database operations
 */
export const ReportDB = {
  create(report) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO reports (id, user_id, patient_id, report_type, extracted_text, ocr_confidence,
                          structured_data, interpretation, clinical_pearls, potential_questions,
                          presentation, sources, google_drive_file_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      report.id,
      report.userId,
      report.patientId || null,
      report.type,
      report.extractedText || null,
      report.ocrConfidence || null,
      JSON.stringify(report.structuredData || {}),
      JSON.stringify(report.interpretation || {}),
      JSON.stringify(report.clinicalPearls || {}),
      JSON.stringify(report.potentialQuestions || {}),
      JSON.stringify(report.presentation || {}),
      JSON.stringify(report.sources || {}),
      report.googleDriveFileId || null
    );
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    const report = stmt.get(id);
    if (report) {
      report.structuredData = JSON.parse(report.structured_data || '{}');
      report.interpretation = JSON.parse(report.interpretation || '{}');
      report.clinicalPearls = JSON.parse(report.clinical_pearls || '{}');
      report.potentialQuestions = JSON.parse(report.potential_questions || '{}');
      report.presentation = JSON.parse(report.presentation || '{}');
      report.sources = JSON.parse(report.sources || '{}');
    }
    return report;
  },

  findByPatientId(patientId, limit = 50) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM reports
      WHERE patient_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(patientId, limit).map(report => ({
      ...report,
      structuredData: JSON.parse(report.structured_data || '{}'),
      interpretation: JSON.parse(report.interpretation || '{}')
    }));
  },

  findByUserId(userId, limit = 50, offset = 0) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM reports
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(userId, limit, offset);
  }
};

/**
 * Session database operations
 */
export const SessionDB = {
  create(session) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sessions (id, user_id, token, device_info, ip_address, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      session.id,
      session.userId,
      session.token,
      session.deviceInfo || null,
      session.ipAddress || null,
      session.expiresAt
    );
  },

  findByToken(token) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > ?');
    return stmt.get(token, new Date().toISOString());
  },

  delete(token) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
    return stmt.run(token);
  },

  deleteExpired() {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM sessions WHERE expires_at <= ?');
    return stmt.run(new Date().toISOString());
  }
};
