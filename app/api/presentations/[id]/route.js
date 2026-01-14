import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/storage/database';

/**
 * GET /api/presentations/[id]
 * Get formatted ward presentation for a report
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Returns:
 * - presentation: Formatted SOAP presentation
 * - pearls: Clinical teaching pearls
 * - questions: Potential attending questions
 */
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = decoded.userId;
    const { id } = params;

    const db = getDatabase();

    // Get report
    const report = db.prepare(`
      SELECT
        r.*,
        p.name as patient_name,
        p.mrn as patient_mrn,
        p.age as patient_age,
        p.gender as patient_gender,
        p.admission_date,
        p.chief_complaint
      FROM reports r
      LEFT JOIN patients p ON r.patient_id = p.id
      WHERE r.id = ? AND r.user_id = ?
    `).get(id, userId);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const presentation = report.presentation ? JSON.parse(report.presentation) : null;
    const clinicalPearls = report.clinical_pearls ? JSON.parse(report.clinical_pearls) : null;
    const potentialQuestions = report.potential_questions ? JSON.parse(report.potential_questions) : null;
    const interpretation = report.interpretation ? JSON.parse(report.interpretation) : null;

    // Build enhanced presentation with patient context
    const enhancedPresentation = {
      ...presentation,
      patient: {
        name: report.patient_name,
        mrn: report.patient_mrn,
        age: report.patient_age,
        gender: report.patient_gender,
        admissionDate: report.admission_date,
        chiefComplaint: report.chief_complaint
      },
      report: {
        id: report.id,
        type: report.report_type,
        createdAt: report.created_at,
        ocrConfidence: report.ocr_confidence
      }
    };

    return NextResponse.json({
      success: true,
      presentation: enhancedPresentation,
      pearls: clinicalPearls,
      questions: potentialQuestions,
      interpretation,
      metadata: {
        reportId: report.id,
        reportType: report.report_type,
        createdAt: report.created_at
      }
    });

  } catch (error) {
    console.error('[Presentations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presentation', details: error.message },
      { status: 500 }
    );
  }
}
