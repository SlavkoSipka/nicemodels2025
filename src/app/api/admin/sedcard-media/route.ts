import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminAction } from '@/lib/admin/notify'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

type OwnerType = 'model' | 'club'
type MediaType = 'photo' | 'video'

const VIDEO_MIME = [
  'video/mp4', 'video/quicktime', 'video/x-ms-wmv',
  'video/x-flv', 'video/x-msvideo', 'video/x-matroska',
]
const MAX_VIDEO_BYTES = 200 * 1024 * 1024

function resolve(ownerType: OwnerType, mediaType: MediaType) {
  const idColumn = ownerType === 'model' ? 'model_id' : 'club_id'
  if (mediaType === 'photo') {
    return {
      idColumn,
      table: ownerType === 'model' ? 'model_photos' : 'club_photos',
      bucket: ownerType === 'model' ? 'model-photos' : 'club-photos',
      folder: 'photos',
    }
  }
  return {
    idColumn,
    table: ownerType === 'model' ? 'model_videos' : 'club_videos',
    bucket: ownerType === 'model' ? 'model-videos' : 'club-videos',
    folder: 'videos',
  }
}

function isOwnerType(v: unknown): v is OwnerType {
  return v === 'model' || v === 'club'
}
function isMediaType(v: unknown): v is MediaType {
  return v === 'photo' || v === 'video'
}

async function notifyOwner(ownerId: string, added: boolean) {
  await notifyAdminAction({
    userId: ownerId,
    title: added ? 'Media added to your profile' : 'Media removed from your profile',
    message: added
      ? 'An administrator added media to your profile.'
      : 'An administrator removed media from your profile.',
    relatedEntityType: 'sedcard_media',
    relatedEntityId: ownerId,
  })
}

// POST (FormData): upload a new photo or video for a model/club
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const ownerType = formData.get('ownerType')
    const mediaType = formData.get('mediaType')
    const ownerId = formData.get('ownerId') as string
    const ownerEmail = (formData.get('ownerEmail') as string) || ''
    const file = formData.get('file') as File | null

    if (!isOwnerType(ownerType) || !isMediaType(mediaType) || !ownerId || !file || file.size === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    if (mediaType === 'video') {
      if (file.size > MAX_VIDEO_BYTES) {
        return NextResponse.json({ error: 'Video exceeds 200MB' }, { status: 400 })
      }
      if (!VIDEO_MIME.includes(file.type)) {
        return NextResponse.json({ error: 'Unsupported video format' }, { status: 400 })
      }
    }

    const { table, bucket, idColumn, folder } = resolve(ownerType, mediaType)
    const admin = createAdminClient()

    const ext = mediaType === 'photo' ? 'webp' : (file.name.split('.').pop() || 'mp4')
    const prefix = ownerEmail || ownerId
    const filePath = `${prefix}/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
    const buffer = await file.arrayBuffer()

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(filePath, buffer, { contentType: file.type || undefined, upsert: false })
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const row: Record<string, unknown> = {
      [idColumn]: ownerId,
      file_path: filePath,
      file_name: file.name,
      is_approved: true,
    }

    if (mediaType === 'photo') {
      const { data: ordRows } = await admin.from(table).select('display_order').eq(idColumn, ownerId)
      const nextOrd = ordRows?.length
        ? Math.max(...ordRows.map((r: { display_order: number | null }) => r.display_order ?? 0)) + 1
        : 0
      row.display_order = nextOrd
    }

    const { data: inserted, error: dbError } = await admin
      .from(table)
      .insert(row)
      .select('*')
      .single()

    if (dbError) {
      await admin.storage.from(bucket).remove([filePath])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    await notifyOwner(ownerId, true)

    return NextResponse.json({
      success: true,
      media: {
        ...inserted,
        url: `${SUPA_URL}/storage/v1/object/public/${bucket}/${filePath}`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// DELETE (JSON): remove a photo or video by its DB id
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { ownerType, mediaType, mediaId } = await request.json()
    if (!isOwnerType(ownerType) || !isMediaType(mediaType) || !mediaId) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    const { table, bucket, idColumn } = resolve(ownerType, mediaType)
    const admin = createAdminClient()

    const { data: media } = await admin
      .from(table)
      .select(`file_path, ${idColumn}`)
      .eq('id', mediaId)
      .single()

    if ((media as any)?.file_path) {
      await admin.storage.from(bucket).remove([(media as any).file_path])
    }
    await admin.from(table).delete().eq('id', mediaId)

    const ownerId = (media as any)?.[idColumn]
    if (ownerId) await notifyOwner(ownerId, false)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// PATCH (JSON): reorder photos, or toggle approval on a single item
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { action, ownerType } = body
    if (!isOwnerType(ownerType)) {
      return NextResponse.json({ error: 'Invalid ownerType' }, { status: 400 })
    }
    const admin = createAdminClient()

    if (action === 'reorder') {
      const orderedIds: string[] = body.orderedIds
      if (!Array.isArray(orderedIds)) {
        return NextResponse.json({ error: 'Missing orderedIds' }, { status: 400 })
      }
      const table = ownerType === 'model' ? 'model_photos' : 'club_photos'
      const results = await Promise.all(
        orderedIds.map((id, display_order) =>
          admin.from(table).update({ display_order }).eq('id', id),
        ),
      )
      if (results.some((r) => r.error)) {
        return NextResponse.json({ error: 'Reorder failed' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'approval') {
      const { mediaType, mediaId, isApproved } = body
      if (!isMediaType(mediaType) || !mediaId || typeof isApproved !== 'boolean') {
        return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
      }
      const { table } = resolve(ownerType, mediaType)
      const { error } = await admin.from(table).update({ is_approved: isApproved }).eq('id', mediaId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
