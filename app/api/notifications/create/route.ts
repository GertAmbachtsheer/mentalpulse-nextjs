import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notificationService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, title, message } = body;

    console.log('[Create Route] Received notification request:', { type, title, message });

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    notificationService.emit({ type, title, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Create Route] Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}