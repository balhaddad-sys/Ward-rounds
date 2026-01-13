/**
 * Google Apps Script Integration API Route
 *
 * Provides endpoints for:
 * - Health check of GAS endpoint
 * - Syncing data to/from GAS
 * - Proxying requests to GAS (if needed)
 */

import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/security/audit-log';
import {
  isGASEnabled,
  checkGASHealth,
  syncPatientToGAS,
  syncReportToGAS
} from '@/lib/integrations/google-apps-script';

/**
 * GET /api/gas - Health check
 */
export async function GET(request) {
  try {
    const health = await checkGASHealth();

    return NextResponse.json({
      success: true,
      gas: health
    });
  } catch (error) {
    console.error('Error checking GAS health:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check GAS health',
        details: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gas - Sync data or perform actions
 */
export async function POST(request) {
  // Verify authentication
  const authResponse = await verifyAuth(request);
  if (authResponse) return authResponse;

  const user = request.user;

  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action parameter is required'
        },
        { status: 400 }
      );
    }

    // Check if GAS integration is enabled
    if (!isGASEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Google Apps Script integration is not enabled',
          message: 'Set ENABLE_GAS_INTEGRATION=true in your environment variables'
        },
        { status: 503 }
      );
    }

    let result;

    switch (action) {
      case 'sync_patient':
        if (!data?.patient) {
          return NextResponse.json(
            {
              success: false,
              error: 'Patient data is required for sync_patient action'
            },
            { status: 400 }
          );
        }

        // Get token from request headers
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        result = await syncPatientToGAS(token, data.patient);

        // Log the sync action
        await logAudit({
          userId: user.id,
          action: 'gas_sync_patient',
          resourceType: 'patient',
          resourceId: data.patient.id,
          status: result.success ? 'success' : 'failed',
          metadata: {
            mrn: data.patient.mrn,
            syncResult: result.action
          }
        });

        break;

      case 'sync_report':
        if (!data?.report) {
          return NextResponse.json(
            {
              success: false,
              error: 'Report data is required for sync_report action'
            },
            { status: 400 }
          );
        }

        const reportToken = request.headers.get('authorization')?.replace('Bearer ', '');
        result = await syncReportToGAS(reportToken, data.report);

        // Log the sync action
        await logAudit({
          userId: user.id,
          action: 'gas_sync_report',
          resourceType: 'report',
          resourceId: data.report.id,
          status: result.success ? 'success' : 'failed',
          metadata: {
            reportType: data.report.type
          }
        });

        break;

      case 'health_check':
        result = await checkGASHealth();
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            validActions: ['sync_patient', 'sync_report', 'health_check']
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error) {
    console.error('Error processing GAS request:', error);

    // Log the error
    await logAudit({
      userId: user.id,
      action: 'gas_request_failed',
      resourceType: 'gas_integration',
      status: 'failed',
      metadata: {
        error: error.message
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process GAS request',
        details: error.message
      },
      { status: 500 }
    );
  }
}
