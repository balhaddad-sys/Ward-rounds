import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32);

/**
 * Encrypt sensitive text data
 * @param {string} text - Plain text to encrypt
 * @returns {Object} - Object containing encrypted data, IV, and auth tag
 */
export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

/**
 * Decrypt encrypted data
 * @param {Object} encryptedData - Object with encrypted, iv, and authTag
 * @returns {string} - Decrypted plain text
 */
export function decrypt(encryptedData) {
  const { encrypted, iv, authTag } = encryptedData;

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt sensitive patient data fields
 * @param {Object} patient - Patient object
 * @returns {Object} - Patient object with encrypted sensitive fields
 */
export function encryptPatientData(patient) {
  const sensitiveFields = ['name', 'mrn', 'chiefComplaint'];
  const encrypted = { ...patient };

  for (const field of sensitiveFields) {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }

  return encrypted;
}

/**
 * Decrypt sensitive patient data fields
 * @param {Object} encryptedPatient - Patient object with encrypted fields
 * @returns {Object} - Patient object with decrypted sensitive fields
 */
export function decryptPatientData(encryptedPatient) {
  const sensitiveFields = ['name', 'mrn', 'chiefComplaint'];
  const decrypted = { ...encryptedPatient };

  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'object') {
      decrypted[field] = decrypt(decrypted[field]);
    }
  }

  return decrypted;
}

/**
 * Hash password for storage
 * @param {string} password - Plain text password
 * @returns {string} - Hashed password
 */
export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes (default 32)
 * @returns {string} - Random hex token
 */
export function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}
