import { NextRequest, NextResponse } from 'next/server';
import { savePushSubscription } from '@/lib/supabaseCalls';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, subscription' },
        { status: 400 }
      );
    }

    await savePushSubscription(userId, subscription);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}
