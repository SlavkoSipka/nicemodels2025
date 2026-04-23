'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { Plus, Search as SearchIcon, Pencil, Bell, BellOff, Trash2, Users, Building2, Briefcase } from 'lucide-react'

interface SavedSearch {
  id: string
  name: string
  entity_type: 'model' | 'club' | 'listing'
  criteria: Record<string, unknown>
  is_active: boolean
  created_at: string
  last_matched_at: string | null
}

const ENTITY_META: Record<string, { label: string; Icon: typeof Users; cls: string }> = {
  model: { label: 'Models', Icon: Users, cls: 'bg-pink-100 text-pink-700' },
  club: { label: 'Clubs', Icon: Building2, cls: 'bg-indigo-100 text-indigo-700' },
  listing: { label: 'Jobs / Rent', Icon: Briefcase, cls: 'bg-amber-100 text-amber-700' },
}

function criteriaPreview(c: Record<string, unknown>): string {
  const parts: string[] = []
  if (c.city) parts.push(`${c.city}`)
  if (c.origin_city && c.radius_km) parts.push(`≤${c.radius_km}km ${c.origin_city}`)
  if (c.ethnicity) parts.push(String(c.ethnicity).replace(/_/g, ' '))
  if (c.nationality) parts.push(String(c.nationality))
  if (c.gender) parts.push(String(c.gender))
  if (c.hair_color) parts.push(String(c.hair_color).replace(/_/g, ' '))
  if (Array.isArray(c.services) && c.services.length) parts.push(`${c.services.length} service(s)`)
  if (Array.isArray(c.languages) && c.languages.length) parts.push(`${c.languages.length} language(s)`)
  if (c.age_min || c.age_max) parts.push(`age ${c.age_min ?? '…'}–${c.age_max ?? '…'}`)
  if (c.listing_type) parts.push(String(c.listing_type))
  if (c.club_area) parts.push(String(c.club_area))
  return parts.length ? parts.join(' · ') : 'Any'
}

export default function SavedSearchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<SavedSearch[]>([])

  useEffect(() => { load() }, [])

  const load = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data } = await supabase
      .from('saved_searches')
      .select('id, name, entity_type, criteria, is_active, created_at, last_matched_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setItems((data as SavedSearch[]) || [])
    setLoading(false)
  }

  const toggleActive = async (item: SavedSearch) => {
    const supabase = createClient()
    const { error } = await supabase.from('saved_searches').update({ is_active: !item.is_active }).eq('id', item.id)
    if (!error) setItems(prev => prev.map(p => (p.id === item.id ? { ...p, is_active: !p.is_active } : p)))
  }

  const remove = async (item: SavedSearch) => {
    if (!confirm(`Delete "${item.name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('saved_searches').delete().eq('id', item.id)
    if (!error) setItems(prev => prev.filter(p => p.id !== item.id))
  }

  if (loading) return null

  return (
    <>
      <DashboardSidebar userRole="user" />
      <div className="min-h-screen bg-gray-50 py-6 md:py-8 px-4 md:px-6 ml-0 md:ml-[280px]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-violet-100 rounded-lg p-2">
                <SearchIcon className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Saved searches</h1>
                <p className="text-sm text-gray-500 mt-0.5">Get notified when new models, clubs or listings match.</p>
              </div>
            </div>
            <Link
              href="/dashboard/user/saved-searches/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New search
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <SearchIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No saved searches yet</h3>
              <p className="text-sm text-gray-500 mb-4">Create one to receive alerts when a matching profile or listing appears.</p>
              <Link
                href="/dashboard/user/saved-searches/new"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" /> Create your first search
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => {
                const meta = ENTITY_META[item.entity_type]
                const Icon = meta.Icon
                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border-2 p-4 flex flex-wrap items-start gap-3 transition-all ${
                      item.is_active ? 'border-gray-200 hover:border-violet-300' : 'border-gray-200 opacity-70'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${meta.cls} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.cls}`}>
                          {meta.label}
                        </span>
                        {!item.is_active && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">{criteriaPreview(item.criteria)}</p>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Created {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {item.last_matched_at && ` · Last match ${new Date(item.last_matched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(item)}
                        title={item.is_active ? 'Pause alerts' : 'Enable alerts'}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        {item.is_active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                      <Link
                        href={`/dashboard/user/saved-searches/${item.id}/edit`}
                        className="p-2 rounded-md text-violet-600 hover:bg-violet-50"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => remove(item)}
                        className="p-2 rounded-md text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
