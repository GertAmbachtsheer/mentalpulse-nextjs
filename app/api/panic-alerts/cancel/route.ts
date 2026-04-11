import { NextRequest, NextResponse } from 'next/server';
import { dismissPanicAlert, getPanicAlertById } from '@/lib/supabaseCalls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, userId } = body;

    if (!alertId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, userId' },
        { status: 400 }
      );
    }

    // 1. Get the alert to find the responder (respondee)
    const alert = await getPanicAlertById(alertId);
    
    // verify the user is the creator
    if (!alert || alert.user_id !== userId) {
      return NextResponse.json(
        { error: 'Alert not found or unauthorized' },
        { status: 404 }
      );
    }

    // 2. Dismiss the alert in DB
    await dismissPanicAlert(alertId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cancel Alert] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel alert' },
      { status: 500 }
    );
  }
}
