import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar, { AdminSidebarCounts } from '@/components/layout/AdminSidebar'

async function loadPendingCounts(): Promise<AdminSidebarCounts> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('get_admin_pending_counts_v1')
    if (!error && data && typeof data === 'object') {
      const o = data as Record<string, number>
      const n = (k: string): number => Number(o[k] ?? 0)
      return {
        verifications: n('verifications'),
        reports: n('reports'),
        media:
          n('model_photos')
          + n('model_videos')
          + n('club_photos')
          + n('club_videos'),
        banners: n('banners'),
        comments: n('comments'),
        blocked: n('blocked'),
      }
    }
  } catch {
    // fall through
  }

  const supabase = await createClient()
  try {
    const [
      verifications,
      reports,
      mediaPhotos,
      mediaVideos,
      clubPhotos,
      clubVideos,
      banners,
      comments,
      blocked,
    ] = await Promise.all([
      supabase.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('model_photos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
      supabase.from('model_videos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
      supabase.from('club_photos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
      supabase.from('club_videos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
      supabase.from('banners').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('model_comments').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_blocked', true),
    ])
    return {
      verifications: verifications.count ?? 0,
      reports: reports.count ?? 0,
      media:
        (mediaPhotos.count ?? 0)
        + (mediaVideos.count ?? 0)
        + (clubPhotos.count ?? 0)
        + (clubVideos.count ?? 0),
      banners: banners.count ?? 0,
      comments: comments.count ?? 0,
      blocked: blocked.count ?? 0,
    }
  } catch {
    return {}
  }
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const counts = await loadPendingCounts()

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar counts={counts} />
      <main className="flex-1 min-w-0 overflow-x-hidden pt-12 md:pt-0">{children}</main>
    </div>
  )
}
