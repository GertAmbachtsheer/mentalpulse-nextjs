import { NextRequest, NextResponse } from 'next/server';
import { getRelevantPanicAlerts } from '@/lib/supabaseCalls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, userId, latitude, longitude } = body;

    if (!alertId || !userId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Query Supabase for the panic alert
    const alerts = await getRelevantPanicAlerts({
      alertId,
      userId,
      latitude,
      longitude,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('[Panic Alert API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch panic alert' },
      { status: 500 }
    );
  }
}
