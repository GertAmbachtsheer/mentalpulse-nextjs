import { NextRequest, NextResponse } from 'next/server';
import { triggerPanicAlert } from '@/lib/supabaseCalls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, latitude, longitude } = body;

    if (!userId || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, latitude, longitude' },
        { status: 400 }
      );
    }

    // 1. Create the panic alert in Supabase
    const alertId = await triggerPanicAlert({ userId, latitude, longitude });

    return NextResponse.json({ success: true, alertId });
  } catch (error) {
    console.error('[Panic Trigger] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger panic alert' },
      { status: 500 }
    );
  }
}
