import { NextRequest, NextResponse } from 'next/server'
import { deactivatePushSubscription } from '@/lib/supabaseCalls'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 })
    }

    await deactivatePushSubscription(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Push Unsubscribe] Error:', err)
    return NextResponse.json({ error: 'Failed to deactivate push subscription' }, { status: 500 })
  }
}
