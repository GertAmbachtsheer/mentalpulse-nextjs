import { NextRequest, NextResponse } from 'next/server';
import { triggerPanicAlert } from '@/lib/supabaseCalls';
import { supabase } from '@/lib/supabase';
import { broadcastAlertEvent } from '@/lib/alertBroadcast';

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

    return NextResponse.json({ success: true, alertId });
  } catch (error) {
    console.error('[Panic Trigger] Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger panic alert' },
      { status: 500 }
    );
  }
}
