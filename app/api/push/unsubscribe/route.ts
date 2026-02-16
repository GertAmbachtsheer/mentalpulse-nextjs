import { NextRequest, NextResponse } from 'next/server';
import { deletePushSubscription } from '@/lib/supabaseCalls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, endpoint } = body;

    if (!userId || !endpoint) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, endpoint' },
        { status: 400 }
      );
    }

    await deletePushSubscription(userId, endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push Unsubscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove push subscription' },
      { status: 500 }
    );
  }
}
