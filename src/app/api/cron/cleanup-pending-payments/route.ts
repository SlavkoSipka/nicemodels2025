import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Cron endpoint that calls public.cleanup_pending_payments() — safety net for
 * orders / banners / job_listings stuck in pending_payment because the user
 * never finished their Stripe Checkout. Stripe sessions auto-expire after
 * 24h; this catches the rest.
 *
 * Auth: header `x-cron-secret: <CRON_SECRET>` or `?cron_secret=...`. Hook into
 * Supabase Scheduled Functions, GitHub Actions, Vercel/Netlify cron, etc.
 *
 * Recommended schedule: every 30 minutes.
 */
export async function POST(req: NextRequest) {
  return run(req)
}
export async function GET(req: NextRequest) {
  return run(req)
}

async function run(req: NextRequest) {
  const provided =
    req.headers.get('x-cron-secret') ||
    new URL(req.url).searchParams.get('cron_secret')
  const expected = process.env.CRON_SECRET
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('cleanup_pending_payments', {
    age: '24:00:00',
  })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // RPC returns a one-row table — Supabase wraps it in an array.
  const row = Array.isArray(data) ? data[0] : data
  return NextResponse.json({
    ok: true,
    banners_cancelled: row?.banners_cancelled ?? 0,
    listings_cancelled: row?.listings_cancelled ?? 0,
    orders_cancelled: row?.orders_cancelled ?? 0,
  })
}
