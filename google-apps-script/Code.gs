/**
 * MedWard - Google Apps Script Backend
 * Main entry point for web app
 */

/**
 * Serves the main web app
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('MedWard - Medical Report Interpreter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * Get user profile or create new user
 */
function loginUser(username) {
  try {
    const db = getDatabaseSheet('users');
    const data = db.getDataRange().getValues();

    // Find existing user
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === username) {
        return {
          success: true,
          user: {
            id: data[i][0],
            username: data[i][1],
            createdAt: data[i][2]
          },
          token: generateToken(data[i][0])
        };
      }
    }

    // Create new user
    const userId = Utilities.getUuid();
    const timestamp = new Date();
    db.appendRow([userId, username, timestamp]);

    return {
      success: true,
      user: {
        id: userId,
        username: username,
        createdAt: timestamp
      },
      token: generateToken(userId)
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get patients for user
 */
function getPatients(token) {
  try {
    const userId = verifyToken(token);
    if (!userId) {
      return { success: false, error: 'Invalid token' };
    }

    const db = getDatabaseSheet('patients');
    const data = db.getDataRange().getValues();
    const patients = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userId) {
        patients.push({
          id: data[i][0],
          mrn: data[i][2],
          name: data[i][3],
          age: data[i][4],
          gender: data[i][5],
          chiefComplaint: data[i][6],
          admissionDate: data[i][7],
          status: data[i][8] || 'stable'
        });
      }
    }

    return {
      success: true,
      patients: patients
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Create new patient
 */
function createPatient(token, patientData) {
  try {
    const userId = verifyToken(token);
    if (!userId) {
      return { success: false, error: 'Invalid token' };
    }

    const db = getDatabaseSheet('patients');
    const patientId = Utilities.getUuid();

    db.appendRow([
      patientId,
      userId,
      patientData.mrn,
      patientData.name,
      patientData.age,
      patientData.gender,
      patientData.chiefComplaint,
      patientData.admissionDate || new Date(),
      patientData.status || 'stable',
      new Date()
    ]);

    return {
      success: true,
      patient: {
        id: patientId,
        ...patientData
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Process uploaded document
 */
function processDocument(token, imageData, reportType) {
  try {
    const userId = verifyToken(token);
    if (!userId) {
      return { success: false, error: 'Invalid token' };
    }

    Logger.log('Processing document for user: ' + userId);

    // Step 1: OCR with Google Cloud Vision
    const ocrResult = extractTextFromImage(imageData);
    if (!ocrResult.success) {
      return ocrResult;
    }

    // Step 2: AI Interpretation with OpenAI
    const interpretation = interpretReport(ocrResult.text, reportType);
    if (!interpretation.success) {
      return interpretation;
    }

    // Step 3: Generate Clinical Pearls
    const pearls = generateClinicalPearls(interpretation.data);

    // Step 4: Generate Questions
    const questions = generateQuestions(interpretation.data);

    // Step 5: Save to database
    const reportId = Utilities.getUuid();
    const db = getDatabaseSheet('reports');
    db.appendRow([
      reportId,
      userId,
      reportType,
      ocrResult.text,
      JSON.stringify(interpretation.data),
      JSON.stringify(pearls.data),
      JSON.stringify(questions.data),
      new Date()
    ]);

    return {
      success: true,
      report: {
        id: reportId,
        type: reportType,
        interpretation: interpretation.data,
        pearls: pearls.data,
        questions: questions.data
      }
    };
  } catch (error) {
    Logger.log('Error processing document: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get or create database sheet
 */
function getDatabaseSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('MedWard Database');
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);

    // Initialize headers
    if (sheetName === 'users') {
      sheet.appendRow(['id', 'username', 'createdAt']);
    } else if (sheetName === 'patients') {
      sheet.appendRow(['id', 'userId', 'mrn', 'name', 'age', 'gender', 'chiefComplaint', 'admissionDate', 'status', 'createdAt']);
    } else if (sheetName === 'reports') {
      sheet.appendRow(['id', 'userId', 'reportType', 'extractedText', 'interpretation', 'pearls', 'questions', 'createdAt']);
    }
  }

  return sheet;
}

/**
 * Generate simple JWT-like token
 */
function generateToken(userId) {
  const timestamp = new Date().getTime();
  const payload = userId + '|' + timestamp;
  return Utilities.base64Encode(payload);
}

/**
 * Verify token and return userId
 */
function verifyToken(token) {
  try {
    const decoded = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    const parts = decoded.split('|');
    if (parts.length === 2) {
      return parts[0];
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get learning statistics
 */
function getLearningStats(token) {
  try {
    const userId = verifyToken(token);
    if (!userId) {
      return { success: false, error: 'Invalid token' };
    }

    const db = getDatabaseSheet('reports');
    const data = db.getDataRange().getValues();
    let userReports = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userId) {
        userReports++;
      }
    }

    return {
      success: true,
      stats: {
        totalReports: userReports,
        apiCallsSaved: Math.floor(userReports * 0.6),
        averageConfidence: 0.85
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Handle POST requests from web app (Next.js client)
 * This enables the Next.js app to use OpenAI through this script
 */
function doPost(e) {
  try {
    // Enable CORS
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    // Parse request
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (error) {
      return output.setContent(JSON.stringify({
        success: false,
        error: 'Invalid JSON payload'
      }));
    }

    const action = requestData.action;
    Logger.log('Received action: ' + action);

    // Handle different actions
    switch (action) {
      case 'ping':
        // Connection test
        return output.setContent(JSON.stringify({
          success: true,
          message: 'Connected to Google Apps Script',
          timestamp: new Date().toISOString()
        }));

      case 'login':
        // User login/registration
        Logger.log('Login request for: ' + requestData.username);
        const loginResult = loginUser(requestData.username);

        return output.setContent(JSON.stringify(loginResult));

      case 'interpret':
        // Interpret medical document using OpenAI
        const text = requestData.text;
        const documentType = requestData.documentType || 'general';

        Logger.log('Interpreting ' + documentType + ' document...');
        const interpretation = interpretReport(text, documentType);

        return output.setContent(JSON.stringify({
          success: interpretation.success,
          interpretation: interpretation.data,
          error: interpretation.error
        }));

      case 'generatePearls':
        // Generate clinical pearls using OpenAI
        Logger.log('Generating clinical pearls...');
        const pearlsResult = generateClinicalPearls(requestData.interpretation);

        return output.setContent(JSON.stringify({
          success: pearlsResult.success,
          pearls: pearlsResult.data,
          error: pearlsResult.error
        }));

      case 'generateQuestions':
        // Generate teaching questions using OpenAI
        Logger.log('Generating teaching questions...');
        const questionsResult = generateQuestions(requestData.interpretation);

        return output.setContent(JSON.stringify({
          success: questionsResult.success,
          questions: questionsResult.data,
          error: questionsResult.error
        }));

      case 'saveReport':
        // Save report to Google Sheets
        Logger.log('Saving report to Sheets...');
        const report = requestData.report;
        const db = getDatabaseSheet('reports');

        db.appendRow([
          report.id || Utilities.getUuid(),
          'web-app', // userId placeholder for web app
          report.type,
          report.extractedText,
          JSON.stringify(report.interpretation),
          JSON.stringify(report.clinicalPearls || {}),
          JSON.stringify(report.potentialQuestions || {}),
          new Date()
        ]);

        return output.setContent(JSON.stringify({
          success: true,
          message: 'Report saved to Google Sheets'
        }));

      case 'uploadFile':
        // Upload file to Google Drive
        Logger.log('Uploading file to Drive...');
        const fileName = requestData.fileName;
        const fileData = requestData.fileData; // base64
        const fileType = requestData.fileType;

        const blob = Utilities.newBlob(
          Utilities.base64Decode(fileData),
          fileType,
          fileName
        );

        const folder = DriveApp.getFolderById(getApiKey('DRIVE_FOLDER_ID') || DriveApp.getRootFolder().getId());
        const file = folder.createFile(blob);

        return output.setContent(JSON.stringify({
          success: true,
          fileId: file.getId(),
          fileUrl: file.getUrl()
        }));

      default:
        return output.setContent(JSON.stringify({
          success: false,
          error: 'Unknown action: ' + action
        }));
    }

  } catch (error) {
    Logger.log('doPost error: ' + error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
