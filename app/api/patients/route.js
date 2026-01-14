import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/lib/storage/database';
import { logAudit } from '@/lib/security/audit-log';

/**
 * GET /api/patients
 * Get list of patients for authenticated user
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Query params:
 * - limit: Number of patients to return (default: 20)
 * - offset: Offset for pagination (default: 0)
 * - search: Search by name or MRN
 *
 * Returns:
 * - patients: Array of patient objects
 * - total: Total count
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
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const search = searchParams.get('search');

    const db = getDatabase();

    // Build query
    let query = 'SELECT * FROM patients WHERE user_id = ?';
    const params = [userId];

    if (search) {
      query += ' AND (name LIKE ? OR mrn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get patients
    const patients = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM patients WHERE user_id = ?';
    const countParams = [userId];

    if (search) {
      countQuery += ' AND (name LIKE ? OR mrn LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const { total } = db.prepare(countQuery).get(...countParams);

    return NextResponse.json({
      success: true,
      patients,
      total,
      hasMore: offset + limit < total,
      pagination: {
        limit,
        offset,
        total
      }
    });

  } catch (error) {
    console.error('[Patients] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patients
 * Create a new patient
 *
 * Headers:
 * - Authorization: Bearer <token>
 *
 * Request body:
 * - name: string (optional)
 * - mrn: string
 * - age: number
 * - gender: string (male, female, other)
 * - admissionDate: string (ISO date, optional)
 * - chiefComplaint: string
 * - status: string (stable, monitoring, critical)
 *
 * Returns:
 * - patient: Created patient object
 */
export async function POST(request) {
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
    const body = await request.json();

    // Validate required fields
    const { name, mrn, age, gender, admissionDate, chiefComplaint, status } = body;

    if (!mrn) {
      return NextResponse.json(
        { error: 'MRN is required' },
        { status: 400 }
      );
    }

    if (age === undefined || age === null) {
      return NextResponse.json(
        { error: 'Age is required' },
        { status: 400 }
      );
    }

    if (!gender || !['male', 'female', 'other'].includes(gender)) {
      return NextResponse.json(
        { error: 'Valid gender is required (male, female, other)' },
        { status: 400 }
      );
    }

    if (!chiefComplaint) {
      return NextResponse.json(
        { error: 'Chief complaint is required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if MRN already exists for this user
    const existing = db.prepare(`
      SELECT id FROM patients WHERE user_id = ? AND mrn = ?
    `).get(userId, mrn);

    if (existing) {
      return NextResponse.json(
        { error: 'Patient with this MRN already exists' },
        { status: 409 }
      );
    }

    // Create patient
    const patientId = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO patients (
        id, user_id, name, mrn, age, gender,
        admission_date, chief_complaint, status,
        report_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      patientId,
      userId,
      name || null,
      mrn,
      age,
      gender,
      admissionDate || null,
      chiefComplaint,
      status || 'stable',
      now,
      now
    );

    // Get created patient
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);

    // Audit log
    logAudit({
      userId,
      action: 'PATIENT_CREATED',
      resourceType: 'patient',
      resourceId: patientId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: { mrn, age, gender },
      success: true
    });

    return NextResponse.json({
      success: true,
      patient
    }, { status: 201 });

  } catch (error) {
    console.error('[Patients] Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create patient', details: error.message },
      { status: 500 }
    );
  }
}
