import { NextRequest, NextResponse } from 'next/server';
import { getActiveRespondedAlert, getUserLocation } from '@/lib/supabaseCalls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    const alert = await getActiveRespondedAlert(userId);

    if (!alert || !alert.respondee) {
      return NextResponse.json({ alert: null });
    }

    // Get the responder's latest location
    const responderLocation = await getUserLocation(alert.respondee);

    return NextResponse.json({
      alert: {
        id: alert.id,
        creatorUserId: alert.user_id,
        responderUserId: alert.respondee,
        creatorLatitude: alert.latitude,
        creatorLongitude: alert.longitude,
        responderLatitude: responderLocation?.latitude || null,
        responderLongitude: responderLocation?.longitude || null,
        createdAt: alert.created_at,
      },
    });
  } catch (error) {
    console.error('[Active Response] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active response' },
      { status: 500 }
    );
  }
}
