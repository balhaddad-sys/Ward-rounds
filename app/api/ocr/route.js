import { NextResponse } from 'next/server';
import { visionClient } from '@/lib/ocr/vision-client';

/**
 * POST /api/ocr
 * Process an image using Google Cloud Vision API for OCR
 */
export async function POST(request) {
  try {
    console.log('[API/OCR] Received OCR request');

    // Check if Google Cloud Vision is configured
    if (!process.env.GOOGLE_CLOUD_CREDENTIALS && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.warn('[API/OCR] Google Cloud Vision not configured, falling back to client-side OCR');
      return NextResponse.json({
        error: 'Server-side OCR not configured. Please use client-side OCR or configure Google Cloud Vision credentials.',
        fallbackToClientSide: true
      }, { status: 503 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType') || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log(`[API/OCR] Processing ${documentType} document...`);
    console.log(`[API/OCR] File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: `Unsupported file type: ${file.type}. Supported types: JPG, PNG, WebP`
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB`
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process with Google Cloud Vision
    console.log('[API/OCR] Starting OCR processing with Google Cloud Vision...');
    const startTime = Date.now();

    const ocrResult = await visionClient.processDocument(buffer, documentType);

    const processingTime = Date.now() - startTime;
    console.log(`[API/OCR] OCR complete in ${processingTime}ms`);
    console.log(`[API/OCR] Confidence: ${ocrResult.confidence?.toFixed(3) || 'N/A'}`);
    console.log(`[API/OCR] Text length: ${ocrResult.fullText?.length || 0} characters`);

    // Check if text was detected
    if (!ocrResult.fullText || ocrResult.fullText.trim().length === 0) {
      console.warn('[API/OCR] No text detected in document');
      return NextResponse.json({
        success: false,
        error: 'No text detected in the image. Please ensure the image is clear and contains readable text.',
        ocrResult: {
          fullText: '',
          confidence: 0,
          structuredData: null
        }
      }, { status: 200 }); // Return 200 but with error in body
    }

    // Return successful result
    return NextResponse.json({
      success: true,
      ocrResult: {
        rawText: ocrResult.fullText,
        fullText: ocrResult.fullText,
        confidence: ocrResult.confidence,
        pages: ocrResult.pages,
        structuredData: ocrResult.structuredData,
        language: ocrResult.language,
        type: documentType
      },
      metadata: {
        processingTime,
        method: 'google-cloud-vision',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('[API/OCR] Error:', error);
    console.error('[API/OCR] Error stack:', error.stack);

    // Check if it's a Google Cloud Vision credentials error
    if (error.message.includes('credentials') || error.message.includes('GOOGLE_CLOUD')) {
      return NextResponse.json({
        error: 'Google Cloud Vision not properly configured. Please check your credentials.',
        fallbackToClientSide: true,
        details: error.message
      }, { status: 503 });
    }

    return NextResponse.json({
      error: `OCR processing failed: ${error.message}`,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * GET /api/ocr
 * Check OCR service status
 */
export async function GET() {
  const hasGoogleCloudCredentials = !!(
    process.env.GOOGLE_CLOUD_CREDENTIALS ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );

  return NextResponse.json({
    status: 'online',
    services: {
      googleCloudVision: {
        available: hasGoogleCloudCredentials,
        configured: hasGoogleCloudCredentials
      },
      clientSideTesseract: {
        available: true,
        configured: true
      }
    },
    recommendation: hasGoogleCloudCredentials
      ? 'Use server-side Google Cloud Vision for best accuracy'
      : 'Use client-side Tesseract.js (Google Cloud Vision not configured)'
  });
}
