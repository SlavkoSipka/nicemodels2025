import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminAction } from '@/lib/admin/notify'

const ALLOWED_TABLES = new Set([
  'profiles',
  'club_details',
  'club_contact_details',
  'club_working_hours',
  'model_details',
  'model_contact_details',
  'model_languages',
  'model_services',
  'model_working_hours',
  'model_rates',
])

async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin' ? user : null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!(await verifyAdmin(supabase))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { operations, notify } = await request.json()

    if (!Array.isArray(operations) || operations.length === 0) {
      return NextResponse.json({ error: 'operations must be a non-empty array' }, { status: 400 })
    }

    const admin = createAdminClient()

    for (const op of operations) {
      const { action, table, data, match, onConflict } = op

      if (!ALLOWED_TABLES.has(table)) {
        return NextResponse.json({ error: `Table "${table}" not allowed` }, { status: 400 })
      }

      let query

      switch (action) {
        case 'upsert':
          query = admin.from(table).upsert(data, onConflict ? { onConflict } : undefined)
          break
        case 'update':
          query = admin.from(table).update(data)
          if (match) for (const [k, v] of Object.entries(match)) query = query.eq(k, v)
          break
        case 'insert':
          query = admin.from(table).insert(data)
          break
        case 'delete':
          query = admin.from(table).delete()
          if (match) for (const [k, v] of Object.entries(match)) query = query.eq(k, v)
          else return NextResponse.json({ error: 'delete requires match' }, { status: 400 })
          break
        default:
          return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 })
      }

      const { error } = await query
      if (error) {
        return NextResponse.json({ error: `${action} ${table}: ${error.message}` }, { status: 500 })
      }
    }

    if (notify && typeof notify === 'object' && typeof notify.userId === 'string' && notify.userId) {
      await notifyAdminAction({
        userId: notify.userId,
        title: typeof notify.title === 'string' && notify.title ? notify.title : 'Your account was updated',
        message: typeof notify.message === 'string' && notify.message
          ? notify.message
          : 'An administrator made changes to your account.',
        actionUrl: typeof notify.actionUrl === 'string' ? notify.actionUrl : null,
        relatedEntityType: typeof notify.relatedEntityType === 'string' ? notify.relatedEntityType : null,
        relatedEntityId: typeof notify.relatedEntityId === 'string' ? notify.relatedEntityId : null,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
