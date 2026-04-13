import { NextResponse } from 'next/server'

/** VAPID public key for subscribe(); read at request time so it always matches server env (avoids stale inlined NEXT_PUBLIC after env-only changes). */
export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  if (!publicKey) {
    return NextResponse.json({ error: 'VAPID public key not configured' }, { status: 503 })
  }

  return NextResponse.json(
    { publicKey },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  )
}
