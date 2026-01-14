/**
 * Image Preprocessing for OCR
 * Handles rotation, perspective correction, and enhancement
 */

/**
 * Preprocess image for better OCR results
 * @param {File|Blob} file - Input image file
 * @returns {Promise<Blob>} Preprocessed image
 */
export async function preprocessImage(file) {
  console.log('[ImagePreprocessor] Starting preprocessing...');

  try {
    // Load image
    const img = await loadImage(file);

    // Create canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Set canvas size to image size
    canvas.width = img.width;
    canvas.height = img.height;

    // Step 1: Auto-rotate based on EXIF orientation
    const orientation = await getImageOrientation(file);
    console.log('[ImagePreprocessor] EXIF orientation:', orientation);

    drawImageWithOrientation(ctx, img, orientation);

    // Step 2: Enhance contrast and brightness
    enhanceImage(ctx, canvas.width, canvas.height);

    // Step 3: Convert to grayscale for better OCR
    convertToGrayscale(ctx, canvas.width, canvas.height);

    // Step 4: Apply sharpening
    sharpenImage(ctx, canvas.width, canvas.height);

    console.log('[ImagePreprocessor] Preprocessing complete');

    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  } catch (error) {
    console.error('[ImagePreprocessor] Error:', error);
    // Return original file if preprocessing fails
    return file;
  }
}

/**
 * Load image from file
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get EXIF orientation
 */
async function getImageOrientation(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const view = new DataView(arrayBuffer);

    // Check for JPEG marker
    if (view.getUint16(0, false) !== 0xFFD8) {
      return 1; // Not a JPEG, assume normal orientation
    }

    const length = view.byteLength;
    let offset = 2;

    while (offset < length) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      if (marker === 0xFFE1) { // APP1 marker (EXIF)
        const exifOffset = offset + 10;

        if (exifOffset + 8 > length) break;

        // Read EXIF header
        const tiffOffset = exifOffset;
        const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;

        // Find orientation tag (0x0112)
        const ifdOffset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
        const tagCount = view.getUint16(ifdOffset, littleEndian);

        for (let i = 0; i < tagCount; i++) {
          const tagOffset = ifdOffset + 2 + (i * 12);
          const tag = view.getUint16(tagOffset, littleEndian);

          if (tag === 0x0112) { // Orientation tag
            return view.getUint16(tagOffset + 8, littleEndian);
          }
        }
      }

      const size = view.getUint16(offset, false);
      offset += size;
    }
  } catch (error) {
    console.warn('[ImagePreprocessor] Could not read EXIF:', error.message);
  }

  return 1; // Default orientation
}

/**
 * Draw image with correct orientation
 */
function drawImageWithOrientation(ctx, img, orientation) {
  const width = img.width;
  const height = img.height;

  // Reset transform
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  switch (orientation) {
    case 2:
      // Flip horizontal
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      // Rotate 180°
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4:
      // Flip vertical
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5:
      // Rotate 90° CW + flip horizontal
      ctx.canvas.width = height;
      ctx.canvas.height = width;
      ctx.rotate(Math.PI / 2);
      ctx.scale(1, -1);
      break;
    case 6:
      // Rotate 90° CW
      ctx.canvas.width = height;
      ctx.canvas.height = width;
      ctx.translate(height, 0);
      ctx.rotate(Math.PI / 2);
      break;
    case 7:
      // Rotate 90° CCW + flip horizontal
      ctx.canvas.width = height;
      ctx.canvas.height = width;
      ctx.translate(0, width);
      ctx.rotate(-Math.PI / 2);
      ctx.scale(1, -1);
      break;
    case 8:
      // Rotate 90° CCW
      ctx.canvas.width = height;
      ctx.canvas.height = width;
      ctx.translate(0, width);
      ctx.rotate(-Math.PI / 2);
      break;
    default:
      // Normal orientation
      break;
  }

  ctx.drawImage(img, 0, 0);
}

/**
 * Enhance image contrast and brightness
 */
function enhanceImage(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calculate histogram
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const brightness = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
    histogram[brightness]++;
  }

  // Find min/max values (ignore outliers)
  const totalPixels = width * height;
  const clipPercent = 0.01; // Clip 1% darkest and lightest pixels
  let min = 0, max = 255;
  let cumulative = 0;

  for (let i = 0; i < 256; i++) {
    cumulative += histogram[i];
    if (cumulative > totalPixels * clipPercent) {
      min = i;
      break;
    }
  }

  cumulative = 0;
  for (let i = 255; i >= 0; i--) {
    cumulative += histogram[i];
    if (cumulative > totalPixels * clipPercent) {
      max = i;
      break;
    }
  }

  // Apply contrast stretching
  const range = max - min;
  if (range > 0) {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, ((data[i] - min) * 255) / range));
      data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - min) * 255) / range));
      data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - min) * 255) / range));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert image to grayscale
 */
function convertToGrayscale(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // Use luminosity method for better results
    const gray = Math.round(
      0.299 * data[i] +      // Red
      0.587 * data[i + 1] +  // Green
      0.114 * data[i + 2]    // Blue
    );

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply sharpening filter
 */
function sharpenImage(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const output = new Uint8ClampedArray(data);

  // Sharpening kernel
  const kernel = [
    0, -1,  0,
   -1,  5, -1,
    0, -1,  0
  ];

  // Apply convolution
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels
        let sum = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIdx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[pixelIdx] * kernel[kernelIdx];
          }
        }

        const outputIdx = (y * width + x) * 4 + c;
        output[outputIdx] = Math.min(255, Math.max(0, sum));
      }
    }
  }

  // Copy sharpened data back
  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Detect and correct perspective distortion
 * This is a simplified version - for advanced correction, consider using OpenCV.js
 */
export async function correctPerspective(file) {
  // For now, this is a placeholder
  // Advanced perspective correction would require:
  // 1. Edge detection (Canny)
  // 2. Line detection (Hough transform)
  // 3. Corner detection
  // 4. Perspective transform

  // This would significantly increase bundle size with OpenCV.js
  // For best results with angled photos, users should use the preprocessing above

  return preprocessImage(file);
}
