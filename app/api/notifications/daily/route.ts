import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { getAllPushSubscriptions, deletePushSubscriptionById } from '@/lib/supabaseCalls'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const PAYLOAD = JSON.stringify({
  title: 'MentalPulse',
  body: 'How are you feeling today? Tap to log your mood.',
  icon: '/icon512_rounded.png',
  badge: '/icon512_rounded.png',
  data: { type: 'daily-checkin', url: '/mood' },
})

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let subscriptions
  try {
    subscriptions = await getAllPushSubscriptions()
  } catch (err) {
    console.error('[Daily Cron] Failed to fetch subscriptions:', err)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }

  let sent = 0, failed = 0, removed = 0

  for (const row of subscriptions) {
    try {
      await webpush.sendNotification(row.subscription, PAYLOAD)
      sent++
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status
      if (status === 410) {
        try {
          await deletePushSubscriptionById(row.id)
          removed++
        } catch (e) {
          console.error(`[Daily Cron] Failed to delete sub ${row.id}:`, e)
        }
      } else {
        console.error(
          `[Daily Cron] Failed to send to sub ${row.id} (status ${status}):`,
          err?.body ?? err?.message
        )
        failed++
      }
    }
  }

  console.log(`[Daily Cron] sent: ${sent}, failed: ${failed}, removed: ${removed}`)
  return NextResponse.json({ sent, failed, removed })
}
