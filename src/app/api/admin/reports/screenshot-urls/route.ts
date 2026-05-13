import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Batch signed screenshot URLs — replaces sequential calls from the admin UI. */

const MAX_BATCH = 40

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { paths } = (await request.json()) as { paths?: string[] }
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ urls: {} })
    }

    const slice = paths.filter((p) => typeof p === 'string' && p.length > 0 && p.length < 500).slice(0, MAX_BATCH)

    const admin = createAdminClient()
    const entries = await Promise.all(
      slice.map(async (path) => {
        const { data, error } = await admin.storage.from('report-screenshots').createSignedUrl(path, 3600)
        if (error || !data?.signedUrl) return [path, null] as const
        return [path, data.signedUrl] as const
      }),
    )

    const urls = Object.fromEntries(entries.filter(([, url]) => url))
    return NextResponse.json({ urls })
  } catch {
    return NextResponse.json({ urls: {} }, { status: 200 })
  }
}
