import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { triggerPanicAlert, getAllPushSubscriptions, deletePushSubscriptionById } from '@/lib/supabaseCalls';
import { supabase } from '@/lib/supabase';
import { broadcastAlertEvent } from '@/lib/alertBroadcast';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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

    // 2. Enrich with user name and broadcast to admin SSE clients
    try {
      const { data: alertRow } = await supabase
        .from('panic_alerts')
        .select('*')
        .eq('id', alertId)
        .single();

      const { data: userRow } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('user_id', userId)
        .maybeSingle();

      broadcastAlertEvent('alert:triggered', {
        ...alertRow,
        user_first_name: userRow?.first_name ?? null,
        user_last_name: userRow?.last_name ?? null,
        respondee_first_name: null,
        respondee_last_name: null,
      });
    } catch (broadcastErr) {
      console.error('[Panic Trigger] Broadcast error:', broadcastErr);
    }

    // 3. Send push notifications to all users except the one who triggered the alert
    try {
      const subscriptions = await getAllPushSubscriptions();
      const others = subscriptions.filter((row) => row.user_id !== userId);

      const { data: userRow } = await supabase
        .from('users')
        .select('first_name, phone_number')
        .eq('user_id', userId)
        .maybeSingle();
      const firstName = userRow?.first_name ?? 'Someone';
      const payload = JSON.stringify({
        title: 'MentalPulse Alert',
        body: `${firstName} needs help nearby. Tap to respond.`,
        icon: '/icon512_rounded.png',
        badge: '/icon512_rounded.png',
        data: {
          type: 'panic-alert',
          alertId,
          phoneNumber: userRow?.phone_number ?? null,
        },
      });

      let sent = 0, failed = 0;
      for (const row of others) {
        try {
          await webpush.sendNotification(row.subscription, payload);
          sent++;
        } catch (err: any) {
          const status = err?.statusCode ?? err?.status;
          if (status === 410) {
            try { await deletePushSubscriptionById(row.id); } catch {}
          } else {
            failed++;
          }
        }
      }
      console.log(`[Panic Trigger] Push notifications sent: ${sent}, failed: ${failed}`);
    } catch (pushErr) {
      console.error('[Panic Trigger] Push notification error:', pushErr);
    }

    return NextResponse.json({ success: true, alertId });
  } catch (error) {
    console.error('[Panic Trigger] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger panic alert' },
      { status: 500 }
    );
  }
}
