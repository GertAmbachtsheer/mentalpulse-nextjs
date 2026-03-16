import { NextRequest, NextResponse } from 'next/server'
import { upsertPushSubscription } from '@/lib/supabaseCalls'

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json()

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, subscription' },
        { status: 400 }
      )
    }

    await upsertPushSubscription(userId, subscription)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[Push Subscribe] Error:', err)
    return NextResponse.json({ error: 'Failed to save push subscription' }, { status: 500 })
  }
}
