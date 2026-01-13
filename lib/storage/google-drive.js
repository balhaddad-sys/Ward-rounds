import { google } from 'googleapis';

let driveClient = null;

/**
 * Initialize Google Drive client
 * @returns {Object} - Drive client
 */
function getDriveClient() {
  if (driveClient) return driveClient;

  const credentials = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uris: [process.env.GOOGLE_REDIRECT_URI]
  };

  const oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
  );

  // Set refresh token if available
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oAuth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
  }

  driveClient = google.drive({ version: 'v3', auth: oAuth2Client });

  return driveClient;
}

/**
 * Create or get MedWard folder in Google Drive
 * @returns {Promise<string>} - Folder ID
 */
export async function getOrCreateMedWardFolder() {
  try {
    const drive = getDriveClient();

    // Search for existing MedWard folder
    const response = await drive.files.list({
      q: "name='MedWard' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files && response.data.files.length > 0) {
      console.log('[GoogleDrive] Found existing MedWard folder');
      return response.data.files[0].id;
    }

    // Create new folder
    const folderMetadata = {
      name: 'MedWard',
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    console.log('[GoogleDrive] Created new MedWard folder');
    return folder.data.id;
  } catch (error) {
    console.error('[GoogleDrive] Error creating folder:', error);
    throw error;
  }
}

/**
 * Save file to Google Drive
 * @param {string} fileName - File name
 * @param {Buffer|string} content - File content
 * @param {string} mimeType - MIME type
 * @param {string} folderId - Parent folder ID
 * @returns {Promise<string>} - File ID
 */
export async function saveFile(fileName, content, mimeType = 'application/json', folderId = null) {
  try {
    const drive = getDriveClient();

    if (!folderId) {
      folderId = await getOrCreateMedWardFolder();
    }

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType,
      body: typeof content === 'string' ? content : Buffer.from(content)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    console.log(`[GoogleDrive] Saved file: ${fileName} (ID: ${file.data.id})`);
    return file.data.id;
  } catch (error) {
    console.error('[GoogleDrive] Error saving file:', error);
    throw error;
  }
}

/**
 * Update existing file in Google Drive
 * @param {string} fileId - File ID
 * @param {Buffer|string} content - New content
 * @param {string} mimeType - MIME type
 * @returns {Promise<string>} - File ID
 */
export async function updateFile(fileId, content, mimeType = 'application/json') {
  try {
    const drive = getDriveClient();

    const media = {
      mimeType,
      body: typeof content === 'string' ? content : Buffer.from(content)
    };

    await drive.files.update({
      fileId: fileId,
      media: media
    });

    console.log(`[GoogleDrive] Updated file: ${fileId}`);
    return fileId;
  } catch (error) {
    console.error('[GoogleDrive] Error updating file:', error);
    throw error;
  }
}

/**
 * Get file from Google Drive
 * @param {string} fileId - File ID
 * @returns {Promise<Buffer>} - File content
 */
export async function getFile(fileId) {
  try {
    const drive = getDriveClient();

    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' });

    return Buffer.from(response.data);
  } catch (error) {
    console.error('[GoogleDrive] Error getting file:', error);
    throw error;
  }
}

/**
 * Delete file from Google Drive
 * @param {string} fileId - File ID
 * @returns {Promise<void>}
 */
export async function deleteFile(fileId) {
  try {
    const drive = getDriveClient();

    await drive.files.delete({
      fileId: fileId
    });

    console.log(`[GoogleDrive] Deleted file: ${fileId}`);
  } catch (error) {
    console.error('[GoogleDrive] Error deleting file:', error);
    throw error;
  }
}

/**
 * List files in folder
 * @param {string} folderId - Folder ID
 * @param {number} maxResults - Maximum results
 * @returns {Promise<Array>} - List of files
 */
export async function listFiles(folderId, maxResults = 100) {
  try {
    const drive = getDriveClient();

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime, size)',
      pageSize: maxResults,
      orderBy: 'modifiedTime desc'
    });

    return response.data.files || [];
  } catch (error) {
    console.error('[GoogleDrive] Error listing files:', error);
    throw error;
  }
}

/**
 * Sync patient data to Google Drive
 * @param {Object} patient - Patient object
 * @returns {Promise<string>} - File ID
 */
export async function syncPatient(patient) {
  const fileName = `patient_${patient.mrn}_${Date.now()}.json`;
  const content = JSON.stringify(patient, null, 2);

  if (patient.googleDriveFileId) {
    // Update existing file
    return await updateFile(patient.googleDriveFileId, content);
  } else {
    // Create new file
    return await saveFile(fileName, content);
  }
}

/**
 * Sync report to Google Drive
 * @param {Object} report - Report object
 * @param {Buffer} imageBuffer - Original image (optional)
 * @returns {Promise<string>} - File ID
 */
export async function syncReport(report, imageBuffer = null) {
  const folderName = `Report_${report.id}`;

  // Create report folder
  const drive = getDriveClient();
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [await getOrCreateMedWardFolder()]
  };

  const folder = await drive.files.create({
    resource: folderMetadata,
    fields: 'id'
  });

  const folderId = folder.data.id;

  // Save report JSON
  const reportJson = JSON.stringify(report, null, 2);
  await saveFile('report.json', reportJson, 'application/json', folderId);

  // Save original image if provided
  if (imageBuffer) {
    await saveFile('original.jpg', imageBuffer, 'image/jpeg', folderId);
  }

  return folderId;
}

/**
 * Check if Google Drive is configured
 * @returns {boolean} - True if configured
 */
export function isConfigured() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

export const driveStorage = {
  getOrCreateMedWardFolder,
  saveFile,
  updateFile,
  getFile,
  deleteFile,
  listFiles,
  syncPatient,
  syncReport,
  isConfigured
};

export default driveStorage;
