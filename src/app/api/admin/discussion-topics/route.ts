import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugifyTitle, uniqueSlug } from '@/lib/discussion/slugify'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null as null, error: 'Unauthorized' as const }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user: null as null, error: 'Forbidden' as const }
  return { user, error: null as null }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authErr } = await requireAdmin()
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || 'Unauthorized' }, { status: authErr === 'Forbidden' ? 403 : 401 })
    }

    const json = await request.json()
    const title = typeof json.title === 'string' ? json.title.trim() : ''
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const body = typeof json.body === 'string' ? json.body : ''
    const status = ['draft', 'active', 'archived'].includes(json.status) ? json.status : 'draft'
    const is_pinned = Boolean(json.is_pinned)
    const cover_image = typeof json.cover_image === 'string' ? json.cover_image : null

    let slug = typeof json.slug === 'string' && json.slug.trim() ? slugifyTitle(json.slug.trim()) : slugifyTitle(title)

    const admin = createAdminClient()
    const { data: clash } = await admin.from('discussion_topics').select('id').eq('slug', slug).maybeSingle()
    if (clash) slug = uniqueSlug(slugifyTitle(title))

    const { data, error } = await admin
      .from('discussion_topics')
      .insert({
        slug,
        title,
        body,
        status,
        is_pinned,
        cover_image,
        created_by: user.id,
      })
      .select('id, slug')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ topic: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { user, error: authErr } = await requireAdmin()
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || 'Unauthorized' }, { status: authErr === 'Forbidden' ? 403 : 401 })
    }

    const json = await request.json()
    const id = typeof json.id === 'string' ? json.id : ''
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof json.title === 'string' && json.title.trim()) updates.title = json.title.trim()
    if (typeof json.body === 'string') updates.body = json.body
    if (['draft', 'active', 'archived'].includes(json.status)) updates.status = json.status
    if (typeof json.is_pinned === 'boolean') updates.is_pinned = json.is_pinned
    if (json.cover_image === null || typeof json.cover_image === 'string') {
      updates.cover_image = json.cover_image ?? null
    }
    if (typeof json.slug === 'string' && json.slug.trim()) {
      const newSlug = slugifyTitle(json.slug.trim())
      const adminCheck = createAdminClient()
      const { data: existing } = await adminCheck.from('discussion_topics').select('id').eq('slug', newSlug).maybeSingle()
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: 'Slug already in use' }, { status: 400 })
      }
      updates.slug = newSlug
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('discussion_topics').update(updates).eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authErr } = await requireAdmin()
    if (authErr || !user) {
      return NextResponse.json({ error: authErr || 'Unauthorized' }, { status: authErr === 'Forbidden' ? 403 : 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('discussion_topics').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
