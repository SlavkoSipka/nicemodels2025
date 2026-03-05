'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Megaphone, CheckCircle, XCircle, Trash2, Mail, ExternalLink } from 'lucide-react'
import BannerCard from '@/components/home/BannerCard'

interface Banner {
  id: string
  owner_id: string
  owner_type: 'model' | 'club'
  title: string
  image_path: string | null
  cta_url: string | null
  status: string
  starts_at: string | null
  expires_at: string | null
  display_order: number
  created_at: string
  owner_email?: string
  owner_name?: string
}

type Filter = 'all' | 'pending' | 'active' | 'expired' | 'rejected'

export default function AdminBannersPage() {
  const [loading, setLoading] = useState(true)
  const [banners, setBanners] = useState<Banner[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  useEffect(() => { loadBanners() }, [])

  const loadBanners = async () => {
    const supabase = createClient()

    const { data: bannersData } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false })

    if (!bannersData) { setLoading(false); return }

    const ownerIds = [...new Set(bannersData.map(b => b.owner_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, username')
      .in('id', ownerIds)

    const profileMap = new Map<string, any>()
    for (const p of profiles ?? []) profileMap.set(p.id, p)

    const clubOwnerIds = bannersData.filter(b => b.owner_type === 'club').map(b => b.owner_id)
    const { data: clubDetails } = clubOwnerIds.length > 0
      ? await supabase.from('club_details').select('club_id, club_name').in('club_id', clubOwnerIds)
      : { data: [] }

    const clubNameMap = new Map<string, string>()
    for (const c of clubDetails ?? []) clubNameMap.set(c.club_id, c.club_name)

    const enriched: Banner[] = bannersData.map(b => ({
      ...b,
      owner_email: profileMap.get(b.owner_id)?.email || '',
      owner_name: b.owner_type === 'club'
        ? clubNameMap.get(b.owner_id) || profileMap.get(b.owner_id)?.username || 'Unknown'
        : profileMap.get(b.owner_id)?.username || 'Unknown',
    }))

    setBanners(enriched)
    setLoading(false)
  }

  const updateStatus = async (bannerId: string, newStatus: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('banners').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', bannerId)
    if (!error) {
      setBanners(banners.map(b => b.id === bannerId ? { ...b, status: newStatus } : b))
    }
  }

  const deleteBanner = async (banner: Banner) => {
    if (!confirm(`Delete banner "${banner.title}"?`)) return
    const supabase = createClient()
    if (banner.image_path) await supabase.storage.from('banners').remove([banner.image_path])
    await supabase.from('banners').delete().eq('id', banner.id)
    setBanners(banners.filter(b => b.id !== banner.id))
  }

  const storageUrl = (path: string | null) =>
    path ? `${SUPA_URL}/storage/v1/object/public/banners/${path}` : null

  const filtered = filter === 'all' ? banners : banners.filter(b => b.status === filter)

  const counts = {
    all: banners.length,
    pending: banners.filter(b => b.status === 'pending').length,
    active: banners.filter(b => b.status === 'active').length,
    expired: banners.filter(b => b.status === 'expired').length,
    rejected: banners.filter(b => b.status === 'rejected').length,
  }

  const statusCls: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-emerald-100 text-emerald-800',
    expired: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-800',
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard/admin" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </Link>
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Manage Banners</h1>
                <p className="text-xs text-gray-500">{banners.length} total banners</p>
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['all', 'pending', 'active', 'expired', 'rejected'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors capitalize ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f} ({counts[f]})
              </button>
            ))}
          </div>

          {/* Banners list */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
              <p className="text-gray-400 font-medium">No banners found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(banner => (
                <div key={banner.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Image */}
                  {banner.image_path ? (
                    <img
                      src={storageUrl(banner.image_path)!}
                      alt={banner.title}
                      className="w-full aspect-[3/4] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center">
                      <Megaphone className="w-10 h-10 text-gray-300" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{banner.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          by {banner.owner_name} ({banner.owner_type})
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusCls[banner.status] || statusCls.pending}`}>
                        {banner.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400">
                      Created {new Date(banner.created_at).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-100">
                      {banner.status !== 'active' && (
                        <button
                          onClick={() => updateStatus(banner.id, 'active')}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Activate
                        </button>
                      )}
                      {banner.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(banner.id, 'rejected')}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                      {banner.status === 'active' && (
                        <button
                          onClick={() => updateStatus(banner.id, 'expired')}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Expire
                        </button>
                      )}
                      {banner.owner_email && (
                        <a
                          href={`mailto:${banner.owner_email}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" /> Contact
                        </a>
                      )}
                      {banner.cta_url && (
                        <a
                          href={banner.cta_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Link
                        </a>
                      )}
                      <button
                        onClick={() => deleteBanner(banner)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
