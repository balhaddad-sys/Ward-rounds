/**
 * Google Apps Script Integration
 *
 * This module provides integration with the deployed Google Apps Script web app.
 * The GAS version uses Google Sheets as a database and provides the same core
 * functionality as the Next.js version.
 *
 * Use cases:
 * - Backup/sync data to Google Sheets
 * - Alternative deployment option for environments without Node.js
 * - Cross-platform data access
 */

/**
 * Get the Google Apps Script URL from environment
 */
function getGASUrl() {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!url) {
    throw new Error('GOOGLE_APPS_SCRIPT_URL environment variable is not set');
  }
  return url;
}

/**
 * Check if GAS integration is enabled
 */
export function isGASEnabled() {
  return process.env.ENABLE_GAS_INTEGRATION === 'true';
}

/**
 * Make a request to the Google Apps Script web app
 *
 * @param {string} action - The action to perform (e.g., 'login', 'getPatients')
 * @param {object} data - The data to send
 * @returns {Promise<object>} Response from GAS
 */
async function callGASEndpoint(action, data = {}) {
  const url = getGASUrl();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        ...data
      }),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`GAS request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error calling GAS endpoint:', error);
    throw error;
  }
}

/**
 * Login user via GAS
 *
 * @param {string} username - Username to login
 * @returns {Promise<object>} User data and token
 */
export async function loginUserGAS(username) {
  if (!isGASEnabled()) {
    throw new Error('GAS integration is not enabled');
  }

  return callGASEndpoint('login', { username });
}

/**
 * Get patients from GAS
 *
 * @param {string} token - Auth token
 * @returns {Promise<object>} List of patients
 */
export async function getPatientsGAS(token) {
  if (!isGASEnabled()) {
    throw new Error('GAS integration is not enabled');
  }

  return callGASEndpoint('getPatients', { token });
}

/**
 * Create patient in GAS
 *
 * @param {string} token - Auth token
 * @param {object} patientData - Patient information
 * @returns {Promise<object>} Created patient
 */
export async function createPatientGAS(token, patientData) {
  if (!isGASEnabled()) {
    throw new Error('GAS integration is not enabled');
  }

  return callGASEndpoint('createPatient', { token, patientData });
}

/**
 * Process document via GAS
 *
 * @param {string} token - Auth token
 * @param {string} imageData - Base64 encoded image data
 * @param {string} reportType - Type of report (lab, imaging, etc.)
 * @returns {Promise<object>} Processing results
 */
export async function processDocumentGAS(token, imageData, reportType) {
  if (!isGASEnabled()) {
    throw new Error('GAS integration is not enabled');
  }

  return callGASEndpoint('processDocument', {
    token,
    imageData,
    reportType
  });
}

/**
 * Sync patient data to GAS
 *
 * @param {string} token - Auth token
 * @param {object} patient - Patient object from local database
 * @returns {Promise<object>} Sync result
 */
export async function syncPatientToGAS(token, patient) {
  if (!isGASEnabled()) {
    console.log('GAS sync skipped - integration not enabled');
    return { success: false, message: 'GAS integration not enabled' };
  }

  try {
    // Check if patient exists in GAS
    const existingPatients = await getPatientsGAS(token);
    const exists = existingPatients.patients?.some(p => p.mrn === patient.mrn);

    if (exists) {
      console.log(`Patient ${patient.mrn} already exists in GAS`);
      return { success: true, message: 'Patient already synced', action: 'none' };
    }

    // Create patient in GAS
    const result = await createPatientGAS(token, {
      mrn: patient.mrn,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      chiefComplaint: patient.chiefComplaint,
      admissionDate: patient.admissionDate,
      status: patient.status
    });

    console.log(`Patient ${patient.mrn} synced to GAS successfully`);
    return { success: true, message: 'Patient synced', action: 'created', data: result };
  } catch (error) {
    console.error('Error syncing patient to GAS:', error);
    return { success: false, message: error.message, action: 'error' };
  }
}

/**
 * Sync report data to GAS
 *
 * @param {string} token - Auth token
 * @param {object} report - Report object with interpretation, pearls, questions
 * @returns {Promise<object>} Sync result
 */
export async function syncReportToGAS(token, report) {
  if (!isGASEnabled()) {
    console.log('GAS sync skipped - integration not enabled');
    return { success: false, message: 'GAS integration not enabled' };
  }

  try {
    // Process the document in GAS
    const result = await processDocumentGAS(
      token,
      report.imageData || report.ocrText,
      report.type
    );

    console.log(`Report synced to GAS successfully`);
    return { success: true, message: 'Report synced', data: result };
  } catch (error) {
    console.error('Error syncing report to GAS:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Health check for GAS endpoint
 *
 * @returns {Promise<object>} Health status
 */
export async function checkGASHealth() {
  if (!isGASEnabled()) {
    return {
      healthy: false,
      message: 'GAS integration not enabled',
      enabled: false
    };
  }

  try {
    const url = getGASUrl();
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow'
    });

    return {
      healthy: response.ok,
      status: response.status,
      message: response.ok ? 'GAS endpoint is accessible' : 'GAS endpoint returned error',
      enabled: true,
      url: url
    };
  } catch (error) {
    return {
      healthy: false,
      message: error.message,
      enabled: true,
      error: error.toString()
    };
  }
}
