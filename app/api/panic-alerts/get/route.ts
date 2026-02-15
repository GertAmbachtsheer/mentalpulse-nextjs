import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Query Convex for the panic alert
    const alerts = await convex.query(api.panicAlerts.getRelevantPanicAlerts, {
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
