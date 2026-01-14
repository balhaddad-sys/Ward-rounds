/**
 * Fix for Base64 Encoding Issues
 * Handles proper base64 conversion for image uploads
 */

/**
 * Convert file to base64 with validation
 * @param {File} file - The file to convert
 * @returns {Promise<string>} Base64 encoded string (without data URL prefix)
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    // Validate file
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      reject(new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`));
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      reject(new Error(`Invalid file type: ${file.type}. Supported: JPEG, PNG, WebP, PDF`));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const result = reader.result;

        if (!result || typeof result !== 'string') {
          reject(new Error('Failed to read file'));
          return;
        }

        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64Match = result.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!base64Match) {
          reject(new Error('Invalid data URL format'));
          return;
        }

        const base64String = base64Match[2];

        // Validate base64 string
        if (!base64String || base64String.length === 0) {
          reject(new Error('Empty base64 data'));
          return;
        }

        // Check if base64 is valid (contains only valid base64 characters)
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(base64String)) {
          reject(new Error('Invalid base64 characters detected'));
          return;
        }

        console.log(`[Base64] Successfully encoded file: ${file.name}`);
        console.log(`[Base64] Original size: ${(file.size / 1024).toFixed(2)}KB`);
        console.log(`[Base64] Base64 length: ${base64String.length} characters`);

        resolve(base64String);
      } catch (error) {
        reject(new Error(`Base64 conversion error: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error(`File read error: ${reader.error?.message || 'Unknown error'}`));
    };

    // Read file as data URL
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 back to blob (for testing/validation)
 * @param {string} base64 - Base64 string
 * @param {string} mimeType - File MIME type
 * @returns {Blob}
 */
export function base64ToBlob(base64, mimeType = 'image/jpeg') {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    throw new Error(`Failed to convert base64 to blob: ${error.message}`);
  }
}

/**
 * Validate base64 string
 * @param {string} base64 - Base64 string to validate
 * @returns {boolean}
 */
export function isValidBase64(base64) {
  if (!base64 || typeof base64 !== 'string') {
    return false;
  }

  // Check for valid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(base64)) {
    return false;
  }

  // Try to decode
  try {
    atob(base64);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get file info for debugging
 * @param {File} file
 * @returns {Object}
 */
export function getFileInfo(file) {
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeKB: (file.size / 1024).toFixed(2),
    sizeMB: (file.size / 1024 / 1024).toFixed(2),
    lastModified: new Date(file.lastModified).toISOString()
  };
}
