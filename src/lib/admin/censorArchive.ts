import type { createAdminClient } from '@/lib/supabase/admin'

/** Private bucket holding the untouched originals of censored photos and videos. */
export const ORIGINALS_BUCKET = 'media-originals'

type Admin = ReturnType<typeof createAdminClient>

export async function ensureOriginalsBucket(admin: Admin) {
  const { data } = await admin.storage.getBucket(ORIGINALS_BUCKET)
  if (data) return
  // Private on purpose: the whole point of censoring is that the untouched
  // frame stops being reachable from the public CDN.
  await admin.storage.createBucket(ORIGINALS_BUCKET, { public: false })
}

export function archivePrefix(table: string, mediaId: string) {
  return `${table}/${mediaId}`
}

export async function findArchived(admin: Admin, table: string, mediaId: string) {
  const { data } = await admin.storage
    .from(ORIGINALS_BUCKET)
    .list(archivePrefix(table, mediaId), { limit: 1 })
  const name = data?.[0]?.name
  return name ? `${archivePrefix(table, mediaId)}/${name}` : null
}

export async function removeArchived(admin: Admin, table: string, mediaId: string) {
  const archived = await findArchived(admin, table, mediaId)
  if (archived) await admin.storage.from(ORIGINALS_BUCKET).remove([archived])
}
