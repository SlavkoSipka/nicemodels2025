import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyAdminAction } from '@/lib/admin/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin photo censoring: replace a published photo with a redacted version
 * (blur / pixelate / black bar painted in the browser) without asking the
 * model to re-upload.
 *
 * The untouched original is archived to a PRIVATE bucket before the public
 * object is replaced, so a mis-drawn redaction can be undone. Archiving only
 * happens on the first edit — editing twice must not overwrite the true
 * original with an already-censored frame.
 */

const ORIGINALS_BUCKET = 'media-originals'

type OwnerType = 'model' | 'club'

function isOwnerType(v: unknown): v is OwnerType {
  return v === 'model' || v === 'club'
}

function resolve(ownerType: OwnerType) {
  return ownerType === 'model'
    ? { table: 'model_photos', bucket: 'model-photos', idColumn: 'model_id' }
    : { table: 'club_photos', bucket: 'club-photos', idColumn: 'club_id' }
}

function contentTypeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'webp') return 'image/webp'
  if (ext === 'png') return 'image/png'
  return 'image/jpeg'
}

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

type Admin = ReturnType<typeof createAdminClient>

async function ensureOriginalsBucket(admin: Admin) {
  const { data } = await admin.storage.getBucket(ORIGINALS_BUCKET)
  if (data) return
  // Private on purpose: the whole point of censoring is that the untouched
  // frame stops being reachable from the public CDN.
  await admin.storage.createBucket(ORIGINALS_BUCKET, { public: false })
}

function archivePrefix(table: string, mediaId: string) {
  return `${table}/${mediaId}`
}

async function findArchived(admin: Admin, table: string, mediaId: string) {
  const { data } = await admin.storage
    .from(ORIGINALS_BUCKET)
    .list(archivePrefix(table, mediaId), { limit: 1 })
  const name = data?.[0]?.name
  return name ? `${archivePrefix(table, mediaId)}/${name}` : null
}

// GET: stream the current image same-origin (a cross-origin <img> would taint
// the editor canvas and break toBlob), or report whether an original is archived.
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const params = request.nextUrl.searchParams
    const ownerType = params.get('ownerType')
    const mediaId = params.get('mediaId')
    if (!isOwnerType(ownerType) || !mediaId) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    const { table, bucket } = resolve(ownerType)
    const admin = createAdminClient()

    const { data: row } = await admin
      .from(table)
      .select('file_path')
      .eq('id', mediaId)
      .maybeSingle()
    const filePath = (row as { file_path?: string } | null)?.file_path
    if (!filePath) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

    if (params.get('meta') === '1') {
      return NextResponse.json({ hasOriginal: Boolean(await findArchived(admin, table, mediaId)) })
    }

    const { data: blob, error } = await admin.storage.from(bucket).download(filePath)
    if (error || !blob) {
      return NextResponse.json({ error: error?.message || 'Download failed' }, { status: 500 })
    }

    return new NextResponse(await blob.arrayBuffer(), {
      headers: {
        'Content-Type': contentTypeFor(filePath),
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

// POST (FormData): store the redacted image in place of the published one.
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const ownerType = formData.get('ownerType')
    const mediaId = formData.get('mediaId') as string
    const file = formData.get('file') as File | null

    if (!isOwnerType(ownerType) || !mediaId || !file || file.size === 0) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }
    if (!['image/webp', 'image/jpeg', 'image/png'].includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 })
    }

    const { table, bucket, idColumn } = resolve(ownerType)
    const admin = createAdminClient()

    const { data: row } = await admin
      .from(table)
      .select(`file_path, file_name, ${idColumn}`)
      .eq('id', mediaId)
      .maybeSingle()
    const current = row as Record<string, any> | null
    if (!current?.file_path) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

    const currentPath: string = current.file_path
    const ownerId: string = current[idColumn]

    await ensureOriginalsBucket(admin)

    // Archive once: a second edit must not bury the untouched frame.
    const alreadyArchived = await findArchived(admin, table, mediaId)
    if (!alreadyArchived) {
      const { data: originalBlob, error: dlError } = await admin.storage.from(bucket).download(currentPath)
      if (dlError || !originalBlob) {
        return NextResponse.json(
          { error: `Could not archive the original: ${dlError?.message || 'download failed'}` },
          { status: 500 },
        )
      }
      const originalName = currentPath.split('/').pop() || `${mediaId}.jpg`
      const { error: archiveError } = await admin.storage
        .from(ORIGINALS_BUCKET)
        .upload(`${archivePrefix(table, mediaId)}/${originalName}`, await originalBlob.arrayBuffer(), {
          contentType: contentTypeFor(currentPath),
          upsert: false,
        })
      // Without a recoverable original the edit is irreversible — refuse it.
      if (archiveError) {
        return NextResponse.json(
          { error: `Could not archive the original: ${archiveError.message}` },
          { status: 500 },
        )
      }
    }

    const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg'
    const dir = currentPath.split('/').slice(0, -1).join('/')
    // New object rather than an overwrite: the old URL may sit in CDN and
    // browser caches, and those must not keep serving the uncensored frame.
    const newPath = `${dir}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(newPath, await file.arrayBuffer(), {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { error: dbError } = await admin
      .from(table)
      .update({ file_path: newPath })
      .eq('id', mediaId)
    if (dbError) {
      await admin.storage.from(bucket).remove([newPath])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    if (currentPath !== newPath) {
      await admin.storage.from(bucket).remove([currentPath])
    }

    if (ownerId) {
      await notifyAdminAction({
        userId: ownerId,
        title: 'A photo on your profile was edited',
        message: 'An administrator censored part of one of your photos.',
        relatedEntityType: 'photo_censor',
        relatedEntityId: mediaId,
      })
    }

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    return NextResponse.json({
      success: true,
      filePath: newPath,
      url: `${SUPA_URL}/storage/v1/object/public/${bucket}/${newPath}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

// PATCH (JSON): put the archived original back and drop the censored copy.
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { ownerType, mediaId } = await request.json()
    if (!isOwnerType(ownerType) || !mediaId) {
      return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
    }

    const { table, bucket } = resolve(ownerType)
    const admin = createAdminClient()

    const archivedPath = await findArchived(admin, table, mediaId)
    if (!archivedPath) return NextResponse.json({ error: 'No original archived' }, { status: 404 })

    const { data: row } = await admin
      .from(table)
      .select('file_path')
      .eq('id', mediaId)
      .maybeSingle()
    const currentPath = (row as { file_path?: string } | null)?.file_path
    if (!currentPath) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

    const { data: blob, error: dlError } = await admin.storage
      .from(ORIGINALS_BUCKET)
      .download(archivedPath)
    if (dlError || !blob) {
      return NextResponse.json({ error: dlError?.message || 'Download failed' }, { status: 500 })
    }

    const ext = archivedPath.split('.').pop() || 'jpg'
    const dir = currentPath.split('/').slice(0, -1).join('/')
    const restoredPath = `${dir}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(restoredPath, await blob.arrayBuffer(), {
        contentType: contentTypeFor(archivedPath),
        cacheControl: '31536000',
        upsert: false,
      })
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

    const { error: dbError } = await admin
      .from(table)
      .update({ file_path: restoredPath })
      .eq('id', mediaId)
    if (dbError) {
      await admin.storage.from(bucket).remove([restoredPath])
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    await admin.storage.from(bucket).remove([currentPath])
    await admin.storage.from(ORIGINALS_BUCKET).remove([archivedPath])

    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    return NextResponse.json({
      success: true,
      filePath: restoredPath,
      url: `${SUPA_URL}/storage/v1/object/public/${bucket}/${restoredPath}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
