import { NextRequest, NextResponse } from 'next/server';
import { getPanicAlertById } from '@/lib/supabaseCalls';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing id parameter' },
        { status: 400 }
      );
    }

    const alert = await getPanicAlertById(id);

    if (!alert) {
      return NextResponse.json({ alert: null });
    }

    return NextResponse.json({ alert });
  } catch (error) {
    console.error('[Panic Status API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}
