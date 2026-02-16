import { NextRequest, NextResponse } from 'next/server';
import { dismissPanicAlert, getPanicAlertById, getUserPushSubscriptions, deletePushSubscription } from '@/lib/supabaseCalls';
import { sendPushToUser } from '@/lib/webPush';

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

    // 3. If there is a responder, send them a push notification
    if (alert.respondee) {
      try {
        await sendPushToUser(alert.respondee, {
          title: 'Alert Cancelled',
          body: 'The user has cancelled the emergency alert.',
          icon: '/icon512_rounded.png',
          badge: '/icon512_rounded.png',
          data: {
            type: 'alert-cancelled',
            alertId,
          },
        });
      } catch (pushError) {
        console.error('[Cancel Alert] Error sending push to responder:', pushError);
        // Continue execution even if push fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cancel Alert] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel alert' },
      { status: 500 }
    );
  }
}
