import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/storage/database';

/**
 * GET /api/reports/[id]
 * Get a specific report by ID
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Returns:
 * - report: Complete report object with all fields
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
      SELECT * FROM reports
      WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const parsedReport = {
      ...report,
      structuredData: report.structured_data ? JSON.parse(report.structured_data) : null,
      interpretation: report.interpretation ? JSON.parse(report.interpretation) : null,
      clinicalPearls: report.clinical_pearls ? JSON.parse(report.clinical_pearls) : null,
      potentialQuestions: report.potential_questions ? JSON.parse(report.potential_questions) : null,
      presentation: report.presentation ? JSON.parse(report.presentation) : null,
      sources: report.sources ? JSON.parse(report.sources) : null,
      metadata: report.metadata ? JSON.parse(report.metadata) : null
    };

    // Get patient info if available
    if (report.patient_id) {
      const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(report.patient_id);
      if (patient) {
        parsedReport.patient = patient;
      }
    }

    return NextResponse.json({
      success: true,
      report: parsedReport
    });

  } catch (error) {
    console.error('[Reports] Get report error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/[id]
 * Delete a specific report
 */
export async function DELETE(request, { params }) {
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

    // Delete report (only if owned by user)
    const result = db.prepare(`
      DELETE FROM reports
      WHERE id = ? AND user_id = ?
    `).run(id, userId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Report not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('[Reports] Delete report error:', error);
    return NextResponse.json(
      { error: 'Failed to delete report', details: error.message },
      { status: 500 }
    );
  }
}
