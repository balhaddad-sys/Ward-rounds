import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/storage/database';
import { processDocument } from '@/lib/ocr/textExtractor';
import {
  interpretDocument,
  generateClinicalPearls,
  generateTeachingQuestions
} from '@/lib/ai/medicalInterpreter';
import { generatePresentation } from '@/lib/presentation/generator';
import { logAudit } from '@/lib/security/audit-log';

/**
 * POST /api/documents/upload
 * Upload and process a medical document
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Form data:
 * - document: File (image or PDF)
 * - reportType: string (lab, imaging, note, ecg, general)
 * - patientId: string (optional)
 *
 * Returns:
 * - report: Complete processed report
 * - learningStats: Information about knowledge base usage
 */
export async function POST(request) {
  const startTime = Date.now();
  let userId = null;

  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('document');
    const reportType = formData.get('reportType') || 'general';
    const patientId = formData.get('patientId');

    if (!file) {
      return NextResponse.json({ error: 'No document provided' }, { status: 400 });
    }

    console.log(`[Upload] Processing ${reportType} document for user ${userId}`);

    // 3. Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. OCR Processing
    console.log('[Upload] Step 1: OCR processing...');
    const ocrResult = await processDocument(buffer, file.type, reportType);

    if (!ocrResult.fullText || ocrResult.confidence < 0.3) {
      return NextResponse.json({
        error: 'Could not extract text from document. Please try a clearer image.',
        confidence: ocrResult.confidence
      }, { status: 400 });
    }

    console.log(`[Upload] OCR complete. Confidence: ${ocrResult.confidence.toFixed(2)}, Length: ${ocrResult.fullText.length} chars`);

    // 5. AI Interpretation
    console.log('[Upload] Step 2: AI interpretation...');
    const interpretation = await interpretDocument(ocrResult, true);

    console.log(`[Upload] Interpretation complete`);

    // 6. Generate Clinical Pearls
    console.log('[Upload] Step 3: Generating clinical pearls...');
    const pearls = await generateClinicalPearls(interpretation, reportType, true);

    // 7. Generate Teaching Questions
    console.log('[Upload] Step 4: Generating questions...');
    const questions = await generateTeachingQuestions(interpretation, reportType, true);

    // 8. Generate Ward Presentation
    console.log('[Upload] Step 5: Generating presentation...');
    const presentation = generatePresentation({
      reportType,
      extractedText: ocrResult.fullText,
      ocrConfidence: ocrResult.confidence,
      structuredData: ocrResult.structuredData,
      interpretation: interpretation.interpretation,
      clinicalPearls: pearls.interpretation?.pearls || [],
      potentialQuestions: questions.interpretation?.questions || []
    });

    // 9. Build complete report object
    const reportId = uuidv4();
    const report = {
      id: reportId,
      userId,
      patientId,
      type: reportType,
      extractedText: ocrResult.fullText,
      ocrConfidence: ocrResult.confidence,
      structuredData: ocrResult.structuredData,
      interpretation: interpretation,
      clinicalPearls: pearls,
      potentialQuestions: questions,
      presentation,
      sources: {
        interpretation: interpretation.source || 'openai',
        pearls: pearls.source || 'openai',
        questions: questions.source || 'openai'
      },
      metadata: {
        processingTime: Date.now() - startTime,
        fileSize: buffer.length,
        fileName: file.name,
        fileType: file.type
      },
      createdAt: new Date().toISOString()
    };

    // 10. Save to database
    console.log('[Upload] Step 6: Saving to database...');
    const db = getDatabase();

    db.prepare(`
      INSERT INTO reports (
        id, user_id, patient_id, report_type,
        extracted_text, ocr_confidence, structured_data,
        interpretation, clinical_pearls, potential_questions,
        presentation, sources, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportId,
      userId,
      patientId,
      reportType,
      ocrResult.fullText,
      ocrResult.confidence,
      JSON.stringify(ocrResult.structuredData),
      JSON.stringify(interpretation),
      JSON.stringify(pearls),
      JSON.stringify(questions),
      JSON.stringify(presentation),
      JSON.stringify(report.sources),
      JSON.stringify(report.metadata),
      report.createdAt
    );

    // 11. Update patient's report count if patientId provided
    if (patientId) {
      db.prepare(`
        UPDATE patients
        SET report_count = (
          SELECT COUNT(*) FROM reports WHERE patient_id = ?
        )
        WHERE id = ?
      `).run(patientId, patientId);
    }

    // 12. Audit log
    logAudit({
      userId,
      action: 'DOCUMENT_UPLOADED',
      resourceType: 'report',
      resourceId: reportId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: {
        reportType,
        patientId,
        ocrConfidence: ocrResult.confidence,
        usedCache: interpretation.source === 'knowledge_base',
        processingTime: report.metadata.processingTime
      },
      success: true
    });

    const processingTime = Date.now() - startTime;
    console.log(`[Upload] Complete! Total time: ${processingTime}ms`);

    // 13. Return response
    return NextResponse.json({
      success: true,
      report,
      learningStats: {
        usedCachedKnowledge: false, // Will be implemented with smart responder
        interpretationConfidence: 0.8,
        pearlsSource: 'openai',
        questionsSource: 'openai',
        apiCallsSaved: 0,
        processingTime
      }
    });

  } catch (error) {
    console.error('[Upload] Error:', error);

    // Log failed upload
    if (userId) {
      try {
        logAudit({
          userId,
          action: 'DOCUMENT_UPLOAD_FAILED',
          resourceType: 'report',
          resourceId: null,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          details: { error: error.message },
          success: false
        });
      } catch (auditError) {
        console.error('[Upload] Audit logging failed:', auditError);
      }
    }

    return NextResponse.json(
      { error: 'Document processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/documents/upload
 * Get upload endpoint information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/documents/upload',
    method: 'POST',
    description: 'Upload and process medical documents with OCR and AI interpretation',
    requiredHeaders: {
      authorization: 'Bearer <token>'
    },
    formData: {
      document: 'File (image or PDF)',
      reportType: 'string (lab, imaging, note, ecg, general)',
      patientId: 'string (optional)'
    },
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxFileSize: '10MB',
    features: [
      'OCR with Google Cloud Vision',
      'AI interpretation with GPT-4',
      'Clinical pearls generation',
      'Teaching questions generation',
      'Ward presentation formatting',
      'Self-learning knowledge base',
      'Automatic cost optimization'
    ]
  });
}
