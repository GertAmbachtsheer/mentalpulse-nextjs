import { NextRequest, NextResponse } from 'next/server';
import { savePanicResponse, getPanicAlertById, respondToPanicAlert, getUserLocation } from '@/lib/supabaseCalls';
import { sendPushToUser } from '@/lib/webPush';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, responderUserId, latitude, longitude } = body;

    if (!alertId || !responderUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, responderUserId' },
        { status: 400 }
      );
    }

    // 1. Save the response in the panic_responses table
    await savePanicResponse(alertId, responderUserId);

    // 2. Update the panic_alerts row: set respondee and active = false
    await respondToPanicAlert(alertId, responderUserId);

    // 3. Look up the original alert to get the trigger user
    const alert = await getPanicAlertById(alertId);

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // 4. Get responder's location (from request body or from DB)
    let responderLat = latitude;
    let responderLng = longitude;

    if (!responderLat || !responderLng) {
      const responderLocation = await getUserLocation(responderUserId);
      if (responderLocation) {
        responderLat = responderLocation.latitude;
        responderLng = responderLocation.longitude;
      }
    }

    // 5. Send a Web Push notification back to the original user
    await sendPushToUser(alert.user_id, {
      title: '💚 Someone Responded!',
      body: 'Someone has responded to your emergency alert and is on their way.',
      icon: '/icon512_rounded.png',
      badge: '/icon512_rounded.png',
      data: {
        type: 'panic-response',
        alertId,
        responderUserId,
        responderLatitude: responderLat,
        responderLongitude: responderLng,
        alertLatitude: alert.latitude,
        alertLongitude: alert.longitude,
      },
    });

    return NextResponse.json({
      success: true,
      alert: {
        id: alert.id,
        user_id: alert.user_id,
        latitude: alert.latitude,
        longitude: alert.longitude,
        respondee: responderUserId,
        responderLatitude: responderLat,
        responderLongitude: responderLng,
      },
    });
  } catch (error) {
    console.error('[Panic Respond] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save response' },
      { status: 500 }
    );
  }
}
