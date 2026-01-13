import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { visionClient } from '@/lib/ocr/vision-client';
import { smartResponder } from '@/lib/knowledge/smart-responder';
import { ReportDB } from '@/lib/storage/database';
import { verifyAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/security/audit-log';
import { generatePresentation } from '@/lib/presentation/generator';

/**
 * POST /api/reports/upload
 * Upload and process a medical document
 */
export async function POST(request) {
  try {
    // Verify authentication
    const authResponse = await verifyAuth(request);
    if (authResponse) return authResponse;

    const user = request.user;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('document');
    const reportType = formData.get('reportType') || 'general';
    const patientId = formData.get('patientId');

    if (!file) {
      return NextResponse.json(
        { error: 'No document provided' },
        { status: 400 }
      );
    }

    console.log(`[Upload] Processing ${reportType} document for user ${user.id}`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: OCR Processing
    console.log('[Upload] Starting OCR processing...');
    const ocrResult = await visionClient.processDocument(buffer, reportType);

    if (!ocrResult.fullText || ocrResult.confidence < 0.5) {
      return NextResponse.json({
        error: 'Could not extract text from document. Please try a clearer image.'
      }, { status: 400 });
    }

    console.log(`[Upload] OCR complete. Confidence: ${ocrResult.confidence.toFixed(3)}`);

    // Step 2: AI Interpretation with Self-Learning
    console.log('[Upload] Getting AI interpretation...');
    const interpretation = await smartResponder.getResponse(
      ocrResult.fullText,
      reportType,
      {
        patientId,
        structuredData: ocrResult.structuredData
      }
    );

    // Step 3: Generate Clinical Pearls
    console.log('[Upload] Generating clinical pearls...');
    const pearls = await smartResponder.getResponse(
      JSON.stringify({
        summary: interpretation.response.summary,
        findings: interpretation.response.findings,
        diagnosis: interpretation.response.differentialConsiderations?.[0]
      }),
      'pearls',
      { reportType }
    );

    // Step 4: Generate Potential Questions
    console.log('[Upload] Generating questions...');
    const questions = await smartResponder.getResponse(
      JSON.stringify({
        summary: interpretation.response.summary,
        findings: interpretation.response.findings,
        keyLabs: ocrResult.structuredData?.results?.slice(0, 5)
      }),
      'questions',
      { reportType }
    );

    // Step 5: Generate Ward Presentation
    console.log('[Upload] Generating presentation...');
    const presentation = generatePresentation({
      type: reportType,
      interpretation: interpretation.response,
      clinicalPearls: pearls.response,
      potentialQuestions: questions.response,
      structuredData: ocrResult.structuredData
    });

    // Step 6: Build report object
    const report = {
      id: uuidv4(),
      userId: user.id,
      patientId,
      type: reportType,
      extractedText: ocrResult.fullText,
      ocrConfidence: ocrResult.confidence,
      structuredData: ocrResult.structuredData,
      interpretation: interpretation.response,
      clinicalPearls: pearls.response,
      potentialQuestions: questions.response,
      presentation,
      sources: {
        interpretation: interpretation.source,
        pearls: pearls.source,
        questions: questions.source
      },
      createdAt: new Date().toISOString()
    };

    // Step 7: Save to database
    try {
      ReportDB.create(report);
      console.log(`[Upload] Report saved to database: ${report.id}`);
    } catch (dbError) {
      console.error('[Upload] Database save error:', dbError);
      // Continue anyway - data is still returned to user
    }

    // Audit log
    logAudit({
      userId: user.id,
      action: 'UPLOAD_REPORT',
      resourceType: 'report',
      resourceId: report.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: {
        reportType,
        usedCache: interpretation.source === 'knowledge_base',
        ocrConfidence: ocrResult.confidence
      },
      success: true
    });

    console.log('[Upload] Complete!');

    return NextResponse.json({
      success: true,
      report,
      learningStats: {
        usedCachedKnowledge: interpretation.source === 'knowledge_base',
        interpretationConfidence: interpretation.confidence,
        interpretationSource: interpretation.source,
        pearlsSource: pearls.source,
        questionsSource: questions.source,
        apiCallsSaved: {
          interpretation: interpretation.apiCallSaved || false,
          pearls: pearls.apiCallSaved || false,
          questions: questions.apiCallSaved || false
        }
      }
    });

  } catch (error) {
    console.error('[Upload] Error:', error);

    logAudit({
      action: 'UPLOAD_REPORT_ERROR',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: { error: error.message },
      success: false,
      errorMessage: error.message
    });

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
