import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/storage/database';

/**
 * GET /api/reports
 * Get list of reports for authenticated user
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Query params:
 * - patientId: Filter by patient ID
 * - type: Filter by report type
 * - limit: Number of reports to return (default: 20)
 * - offset: Offset for pagination (default: 0)
 *
 * Returns:
 * - reports: Array of report objects
 * - total: Total count
 * - hasMore: Boolean indicating if more reports exist
 */
export async function GET(request) {
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
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const reportType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const db = getDatabase();

    // Build query
    let query = 'SELECT * FROM reports WHERE user_id = ?';
    const params = [userId];

    if (patientId) {
      query += ' AND patient_id = ?';
      params.push(patientId);
    }

    if (reportType) {
      query += ' AND report_type = ?';
      params.push(reportType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get reports
    const reports = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM reports WHERE user_id = ?';
    const countParams = [userId];

    if (patientId) {
      countQuery += ' AND patient_id = ?';
      countParams.push(patientId);
    }

    if (reportType) {
      countQuery += ' AND report_type = ?';
      countParams.push(reportType);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    // Parse JSON fields
    const parsedReports = reports.map(report => ({
      ...report,
      structuredData: report.structured_data ? JSON.parse(report.structured_data) : null,
      interpretation: report.interpretation ? JSON.parse(report.interpretation) : null,
      clinicalPearls: report.clinical_pearls ? JSON.parse(report.clinical_pearls) : null,
      potentialQuestions: report.potential_questions ? JSON.parse(report.potential_questions) : null,
      presentation: report.presentation ? JSON.parse(report.presentation) : null,
      sources: report.sources ? JSON.parse(report.sources) : null,
      metadata: report.metadata ? JSON.parse(report.metadata) : null
    }));

    return NextResponse.json({
      success: true,
      reports: parsedReports,
      total,
      hasMore: offset + limit < total,
      pagination: {
        limit,
        offset,
        total
      }
    });

  } catch (error) {
    console.error('[Reports] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error.message },
      { status: 500 }
    );
  }
}
