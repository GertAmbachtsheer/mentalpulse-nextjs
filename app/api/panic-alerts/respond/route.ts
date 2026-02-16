import { NextRequest, NextResponse } from 'next/server';
import { savePanicResponse, getPanicAlertById } from '@/lib/supabaseCalls';
import { sendPushToUser } from '@/lib/webPush';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, responderUserId } = body;

    if (!alertId || !responderUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, responderUserId' },
        { status: 400 }
      );
    }

    // 1. Save the response in Supabase
    await savePanicResponse(alertId, responderUserId);

    // 2. Look up the original alert to get the trigger user
    const alert = await getPanicAlertById(alertId);

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // 3. Send a Web Push notification back to the original user
    await sendPushToUser(alert.user_id, {
      title: '💚 Someone Responded!',
      body: 'Someone has responded to your emergency alert.',
      icon: '/icon512_rounded.png',
      badge: '/icon512_rounded.png',
      data: {
        type: 'panic-response',
        alertId,
        responderUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Panic Respond] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    );
  }
}
