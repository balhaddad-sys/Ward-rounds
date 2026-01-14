import { NextResponse } from 'next/server';
import { getServerPostHog } from '@/lib/analytics/posthog-server';
import { analyzeBugPatterns, getBugStats } from '@/lib/analytics/bug-analyzer';

/**
 * GET /api/analytics/bugs
 * Get bug analysis and statistics
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log(`[Analytics/Bugs] Fetching bugs for last ${days} days...`);

    const posthog = getServerPostHog();

    if (!posthog) {
      return NextResponse.json({
        error: 'PostHog not configured',
        message: 'Add NEXT_PUBLIC_POSTHOG_KEY to environment variables'
      }, { status: 503 });
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // In a real implementation, you would query PostHog API
    // For now, we'll return mock data structure
    // To actually query PostHog, you need to use their query API
    // https://posthog.com/docs/api/query

    // Mock error events for demonstration
    const mockErrors = generateMockErrors(days);

    // Analyze patterns
    const analysis = analyzeBugPatterns(mockErrors);
    const stats = getBugStats(mockErrors);

    return NextResponse.json({
      success: true,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days
      },
      analysis,
      stats,
      message: 'Note: This is demo data. Connect to PostHog API for real data.'
    });

  } catch (error) {
    console.error('[Analytics/Bugs] Error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

/**
 * Generate mock error events for demonstration
 * Replace this with actual PostHog API query
 */
function generateMockErrors(days) {
  const errors = [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // OCR errors
  for (let i = 0; i < 5; i++) {
    errors.push({
      event: '$exception',
      timestamp: new Date(now - Math.random() * days * dayMs).toISOString(),
      distinct_id: `user_${Math.floor(Math.random() * 10)}`,
      properties: {
        error_message: 'No text detected in image',
        error_name: 'OCRError',
        category: 'ocr',
        ocr_method: 'tesseract-js',
        file_type: 'image/jpeg'
      }
    });
  }

  // AI errors
  for (let i = 0; i < 3; i++) {
    errors.push({
      event: '$exception',
      timestamp: new Date(now - Math.random() * days * dayMs).toISOString(),
      distinct_id: `user_${Math.floor(Math.random() * 10)}`,
      properties: {
        error_message: 'OpenAI API rate limit exceeded',
        error_name: 'RateLimitError',
        category: 'ai',
        ai_provider: 'openai'
      }
    });
  }

  // Network errors
  for (let i = 0; i < 2; i++) {
    errors.push({
      event: '$exception',
      timestamp: new Date(now - Math.random() * days * dayMs).toISOString(),
      distinct_id: `user_${Math.floor(Math.random() * 10)}`,
      properties: {
        error_message: 'Network request timeout',
        error_name: 'NetworkError',
        category: 'network'
      }
    });
  }

  return errors.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * POST /api/analytics/bugs/report
 * Manually report a bug
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { error, context } = body;

    if (!error) {
      return NextResponse.json({
        error: 'Missing error data'
      }, { status: 400 });
    }

    console.log('[Analytics/Bugs] Manual bug report:', error);

    // Track with PostHog
    const posthog = getServerPostHog();
    if (posthog) {
      posthog.capture({
        distinctId: context.userId || 'anonymous',
        event: '$exception',
        properties: {
          ...error,
          ...context,
          manual_report: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Bug reported successfully'
    });

  } catch (error) {
    console.error('[Analytics/Bugs] Report error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
