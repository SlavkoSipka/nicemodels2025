import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminAction } from '@/lib/admin/notify'
import { ORIGINALS_BUCKET, archivePrefix, ensureOriginalsBucket, findArchived } from '@/lib/admin/censorArchive'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin video censoring. The browser re-encodes the clip; this route only
 * coordinates storage, because video bodies exceed the serverless request limit
 * and therefore go straight to Supabase through a signed upload URL.
 */

type OwnerType = 'model' | 'club'

function isOwnerType(v: unknown): v is OwnerType {
  return v === 'model' || v === 'club'
}

function resolve(ownerType: OwnerType) {
  return ownerType === 'model'
    ? { table: 'model_videos', bucket: 'model-videos', idColumn: 'model_id' }
    : { table: 'club_videos', bucket: 'club-videos', idColumn: 'club_id' }
}

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

function dirOf(path: string) {
  return path.split('/').slice(0, -1).join('/')
}

function newObjectPath(currentPath: string, ext: string) {
  return `${dirOf(currentPath)}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
}

function publicUrl(bucket: string, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/public/${bucket}/${path}`
}

async function loadVideo(admin: ReturnType<typeof createAdminClient>, ownerType: OwnerType, mediaId: string) {
  const { table, idColumn } = resolve(ownerType)
  const { data } = await admin
    .from(table)
    .select(`file_path, file_name, ${idColumn}`)
    .eq('id', mediaId)
    .maybeSingle()
  return data as Record<string, string> | null
}

export async function GET(request: NextRequest) {
  try {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const ownerType = request.nextUrl.searchParams.get('ownerType')
    const mediaId = request.nextUrl.searchParams.get('mediaId')
    if (!isOwnerType(ownerType) || !mediaId) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }
    const admin = createAdminClient()
    const row = await loadVideo(admin, ownerType, mediaId)
    if (!row?.file_path) return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    const { table, bucket } = resolve(ownerType)
    return NextResponse.json({
      url: publicUrl(bucket, row.file_path),
      fileName: row.file_name,
      hasOriginal: Boolean(await findArchived(admin, table, mediaId)),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

// POST (JSON): `prepare` archives the original and issues an upload slot,
// `commit` swaps the row to the uploaded file and removes the uncensored one.
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { action, ownerType, mediaId, path } = await request.json()
    if (!isOwnerType(ownerType) || !mediaId) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    const { table, bucket, idColumn } = resolve(ownerType)
    const admin = createAdminClient()
    const row = await loadVideo(admin, ownerType, mediaId)
    if (!row?.file_path) return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    const currentPath = row.file_path

    if (action === 'prepare') {
      await ensureOriginalsBucket(admin)
      // Archive once: a second edit must not bury the untouched video.
      if (!(await findArchived(admin, table, mediaId))) {
        const name = currentPath.split('/').pop() || `${mediaId}.mp4`
        const { error } = await admin.storage
          .from(bucket)
          .copy(currentPath, `${archivePrefix(table, mediaId)}/${name}`, { destinationBucket: ORIGINALS_BUCKET })
        if (error) {
          return NextResponse.json({ error: `Could not archive the original: ${error.message}` }, { status: 500 })
        }
      }
      const { data, error } = await admin.storage.from(bucket).createSignedUploadUrl(newObjectPath(currentPath, 'mp4'))
      if (error || !data) {
        return NextResponse.json({ error: error?.message || 'Could not prepare the upload' }, { status: 500 })
      }
      return NextResponse.json({ bucket, path: data.path, token: data.token })
    }

    if (action === 'commit') {
      const dir = dirOf(currentPath)
      if (typeof path !== 'string' || path === currentPath || dirOf(path) !== dir || !path.endsWith('.mp4')) {
        return NextResponse.json({ error: 'Invalid upload path' }, { status: 400 })
      }
      const name = path.split('/').pop()!
      const { data: found } = await admin.storage.from(bucket).list(dir, { search: name, limit: 1 })
      if (found?.[0]?.name !== name) return NextResponse.json({ error: 'Upload not found' }, { status: 400 })

      const { error } = await admin.from(table).update({ file_path: path }).eq('id', mediaId)
      if (error) {
        await admin.storage.from(bucket).remove([path])
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      await admin.storage.from(bucket).remove([currentPath])

      if (row[idColumn]) {
        await notifyAdminAction({
          userId: row[idColumn],
          title: 'A video on your profile was edited',
          message: 'An administrator censored part of one of your videos.',
          relatedEntityType: 'video_censor',
          relatedEntityId: mediaId,
        })
      }
      return NextResponse.json({ success: true, filePath: path, url: publicUrl(bucket, path) })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

// PATCH (JSON): put the archived original back and drop the censored copy.
export async function PATCH(request: NextRequest) {
  try {
    if (!(await verifyAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { ownerType, mediaId } = await request.json()
    if (!isOwnerType(ownerType) || !mediaId) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }
    const { table, bucket } = resolve(ownerType)
    const admin = createAdminClient()
    const archived = await findArchived(admin, table, mediaId)
    if (!archived) return NextResponse.json({ error: 'No original archived' }, { status: 404 })
    const row = await loadVideo(admin, ownerType, mediaId)
    if (!row?.file_path) return NextResponse.json({ error: 'Video not found' }, { status: 404 })

    const restored = newObjectPath(row.file_path, archived.split('.').pop() || 'mp4')
    const { error: copyError } = await admin.storage
      .from(ORIGINALS_BUCKET)
      .copy(archived, restored, { destinationBucket: bucket })
    if (copyError) return NextResponse.json({ error: copyError.message }, { status: 500 })

    const { error } = await admin.from(table).update({ file_path: restored }).eq('id', mediaId)
    if (error) {
      await admin.storage.from(bucket).remove([restored])
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    await admin.storage.from(bucket).remove([row.file_path])
    await admin.storage.from(ORIGINALS_BUCKET).remove([archived])
    return NextResponse.json({ success: true, filePath: restored, url: publicUrl(bucket, restored) })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
