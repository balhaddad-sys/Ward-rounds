/**
 * Database Initialization Script for MedWard
 * Creates all necessary database tables and indexes
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ Created data directory');
}

// Initialize main application database
const dbPath = path.join(dataDir, 'medward.db');
const db = new Database(dbPath);

console.log('Initializing MedWard database...\n');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    device_fingerprint TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_access TEXT,
    google_drive_folder_id TEXT,
    google_refresh_token TEXT,
    settings TEXT DEFAULT '{}',
    role TEXT DEFAULT 'user'
  );

  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON users(device_fingerprint);
`);
console.log('✓ Created users table');

// Create patients table
db.exec(`
  CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mrn TEXT NOT NULL,
    name TEXT,
    age INTEGER,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    admission_date TEXT,
    chief_complaint TEXT,
    status TEXT DEFAULT 'stable' CHECK(status IN ('stable', 'monitoring', 'critical')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    google_drive_file_id TEXT,
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_patients_user ON patients(user_id);
  CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
  CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
`);
console.log('✓ Created patients table');

// Create reports table
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    patient_id TEXT,
    report_type TEXT NOT NULL CHECK(report_type IN ('lab', 'imaging', 'note', 'ecg', 'general')),
    extracted_text TEXT,
    ocr_confidence REAL,
    structured_data TEXT,
    interpretation TEXT,
    clinical_pearls TEXT,
    potential_questions TEXT,
    presentation TEXT,
    sources TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    google_drive_file_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
  CREATE INDEX IF NOT EXISTS idx_reports_patient ON reports(patient_id);
  CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
  CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
`);
console.log('✓ Created reports table');

// Create sessions table (for token management)
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    device_info TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    last_used TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
`);
console.log('✓ Created sessions table');

// Create knowledge base tables
const knowledgeDbPath = path.join(dataDir, 'knowledge.db');
const knowledgeDb = new Database(knowledgeDbPath);

knowledgeDb.exec(`
  CREATE TABLE IF NOT EXISTS knowledge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    topic TEXT NOT NULL,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    embedding TEXT,
    confidence REAL DEFAULT 0.0,
    usage_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_used TEXT,
    metadata TEXT DEFAULT '{}'
  );

  CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge(category);
  CREATE INDEX IF NOT EXISTS idx_knowledge_topic ON knowledge(topic);
  CREATE INDEX IF NOT EXISTS idx_knowledge_usage ON knowledge(usage_count);
  CREATE INDEX IF NOT EXISTS idx_knowledge_confidence ON knowledge(confidence);

  CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts USING fts5(
    query,
    topic,
    content='knowledge',
    content_rowid='id'
  );

  -- Trigger to keep FTS index in sync
  CREATE TRIGGER IF NOT EXISTS knowledge_ai AFTER INSERT ON knowledge BEGIN
    INSERT INTO knowledge_fts(rowid, query, topic) VALUES (new.id, new.query, new.topic);
  END;

  CREATE TRIGGER IF NOT EXISTS knowledge_ad AFTER DELETE ON knowledge BEGIN
    DELETE FROM knowledge_fts WHERE rowid = old.id;
  END;

  CREATE TRIGGER IF NOT EXISTS knowledge_au AFTER UPDATE ON knowledge BEGIN
    UPDATE knowledge_fts SET query = new.query, topic = new.topic WHERE rowid = new.id;
  END;
`);
console.log('✓ Created knowledge base tables');

// Create audit log tables
const auditDbPath = path.join(dataDir, 'audit.db');
const auditDb = new Database(auditDbPath);

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
console.log('✓ Created audit log tables');

// Close databases
db.close();
knowledgeDb.close();
auditDb.close();

console.log('\n✅ Database initialization complete!\n');
console.log('Database files created:');
console.log(`  - ${dbPath}`);
console.log(`  - ${knowledgeDbPath}`);
console.log(`  - ${auditDbPath}`);
