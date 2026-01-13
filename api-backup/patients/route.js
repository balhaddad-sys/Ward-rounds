import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { PatientDB } from '@/lib/storage/database';
import { verifyAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/security/audit-log';

/**
 * GET /api/patients
 * List all patients for authenticated user
 */
export async function GET(request) {
  try {
    // Verify authentication
    const authResponse = await verifyAuth(request);
    if (authResponse) return authResponse;

    const user = request.user;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const patients = PatientDB.findByUserId(user.id, limit, offset);

    logAudit({
      userId: user.id,
      action: 'LIST_PATIENTS',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: { count: patients.length },
      success: true
    });

    return NextResponse.json({
      success: true,
      patients,
      total: patients.length
    });

  } catch (error) {
    console.error('[Patients] List error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/patients
 * Create a new patient
 */
export async function POST(request) {
  try {
    // Verify authentication
    const authResponse = await verifyAuth(request);
    if (authResponse) return authResponse;

    const user = request.user;
    const body = await request.json();

    const patient = {
      id: uuidv4(),
      userId: user.id,
      mrn: body.mrn,
      name: body.name,
      age: body.age,
      gender: body.gender,
      admissionDate: body.admissionDate || new Date().toISOString(),
      chiefComplaint: body.chiefComplaint,
      status: body.status || 'stable',
      metadata: body.metadata || {}
    };

    PatientDB.create(patient);

    logAudit({
      userId: user.id,
      action: 'CREATE_PATIENT',
      resourceType: 'patient',
      resourceId: patient.id,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent'),
      details: { mrn: patient.mrn },
      success: true
    });

    return NextResponse.json({
      success: true,
      patient
    });

  } catch (error) {
    console.error('[Patients] Create error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
