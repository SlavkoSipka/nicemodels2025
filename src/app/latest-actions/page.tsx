import { createAdminClient } from '@/lib/supabase/admin'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import LatestActionsClient from './LatestActionsClient'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  path: '/latest-actions',
  title: 'Neueste Aktivitäten',
  description: 'Sieh dir die neuesten Aktivitäten, neue Models, Clubs und Updates auf NiceModels.ch an.',
})

export const dynamic = 'force-dynamic'

export default async function LatestActionsPage() {
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const [
    { count: totalModels },
    { count: totalClubs },
    { count: totalPhotos },
    { count: totalVideos },
    { count: totalComments },
    { count: totalBanners },
    { data: actions },
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'model').eq('onboarding_completed', true).eq('is_blocked', false),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'company').eq('onboarding_completed', true).eq('is_blocked', false),
    admin.from('model_photos').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('model_videos').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    admin.from('model_comments').select('id', { count: 'exact', head: true }).in('status', ['approved', 'reviewed']),
    admin.from('banners').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('site_actions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const actorIds = [...new Set((actions || []).map(a => a.actor_id).filter(Boolean))]
  let actorMap: Record<string, { username: string; showname?: string; photoUrl?: string }> = {}

  if (actorIds.length) {
    const [{ data: profiles }, { data: details }, { data: photos }] = await Promise.all([
      admin.from('profiles').select('id, username, role, avatar_url').in('id', actorIds).eq('is_blocked', false),
      admin.from('model_details').select('model_id, showname').in('model_id', actorIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', actorIds)
        .eq('is_approved', true).order('model_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
    ])

    const detMap = new Map((details || []).map(d => [d.model_id, d]))
    const pMap = new Map<string, string>()
    for (const p of photos || []) {
      if (!pMap.has(p.model_id) && p.file_path) {
        pMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }

    for (const prof of profiles || []) {
      actorMap[prof.id] = {
        username: prof.username,
        showname: detMap.get(prof.id)?.showname,
        photoUrl: pMap.get(prof.id) || prof.avatar_url || undefined,
      }
    }
  }

  // Drop actions whose actor is blocked (actorMap won't contain them)
  const enrichedActions = (actions || [])
    .filter(a => !a.actor_id || actorMap[a.actor_id])
    .map(a => ({
      ...a,
      actor: a.actor_id ? actorMap[a.actor_id] || null : null,
    }))

  const stats = {
    models: totalModels || 0,
    clubs: totalClubs || 0,
    photos: totalPhotos || 0,
    videos: totalVideos || 0,
    comments: totalComments || 0,
    banners: totalBanners || 0,
  }

  return (
    <>
      <Navbar />
      <LatestActionsClient actions={enrichedActions} stats={stats} />
      <Footer />
    </>
  )
}
