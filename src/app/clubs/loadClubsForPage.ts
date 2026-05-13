import { createClient } from '@/lib/supabase/server'
import { fetchViewCounts } from '@/lib/viewCounts'
import type { Club, RpcClubRow } from './types'

const SUPA_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/public/club-photos`

export async function loadClubsForPage(): Promise<Club[]> {
  const supabase = await createClient()

  const { data: clubsData, error } = await supabase.rpc('clubs_with_active_ads')
  if (error || !clubsData?.length) return []

  const rows = clubsData as RpcClubRow[]
  const ids = rows.map((c) => c.id)

  const [photosAll, contactsRes, detailsRes] = await Promise.all([
    supabase
      .from('club_photos')
      .select('club_id, file_path, uploaded_at')
      .in('club_id', ids)
      .eq('is_approved', true),
    supabase
      .from('club_contact_details')
      .select('club_id, phone_number, website, address, city')
      .in('club_id', ids),
    supabase
      .from('club_details')
      .select('club_id, about_description, display_name, club_name, is_club, area')
      .in('club_id', ids),
  ])

  const photosGrouped = new Map<string, { file_path: string; uploaded_at: string }[]>()
  for (const row of photosAll.data || []) {
    const list = photosGrouped.get(row.club_id) || []
    list.push({ file_path: row.file_path, uploaded_at: row.uploaded_at })
    photosGrouped.set(row.club_id, list)
  }
  for (const list of photosGrouped.values()) {
    list.sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime())
  }

  const contactByClub = new Map<
    string,
    {
      club_id: string
      phone_number: string | null
      website: string | null
      address: string | null
      city: string | null
    }
  >((contactsRes.data || []).map((c) => [c.club_id, c]))
  const detailsByClub = new Map<
    string,
    {
      club_id: string
      about_description: string | null
      display_name: string | null
      club_name: string | null
      is_club: boolean | null
      area: string | null
    }
  >((detailsRes.data || []).map((d) => [d.club_id, d]))

  const result = rows.map((club) => {
    const details = detailsByClub.get(club.id)
    const contact = contactByClub.get(club.id)
    const photoRows = (photosGrouped.get(club.id) || []).slice(0, 3)
    const urls = photoRows.map((p) => `${SUPA_BASE}/${p.file_path}`)

    return {
      id: club.id,
      username: club.username,
      club_name: details?.club_name || club.club_name || '',
      display_name: details?.display_name || club.display_name || club.club_name || '',
      area: details?.area || club.area || '',
      city: contact?.city || '',
      is_club: details?.is_club ?? club.is_club ?? true,
      description: details?.about_description?.trim() || '',
      address: contact?.address || '',
      phone: contact?.phone_number || '',
      website: contact?.website || '',
      photoUrl: urls[0] || null,
      extraPhotos: urls.slice(1),
    }
  })

  const shuffled = [...result]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const viewCountMap = await fetchViewCounts(supabase, 'club', shuffled.map((c) => c.id))
  return shuffled.map((c) => ({ ...c, view_count: viewCountMap.get(c.id) ?? 0 }))
}
