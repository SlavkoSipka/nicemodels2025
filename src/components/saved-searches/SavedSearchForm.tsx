'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NearbyFilter, { type NearbyValue } from '@/components/filters/NearbyFilter'
import { Loader2, Save, Trash2 } from 'lucide-react'

export type SavedEntity = 'model' | 'club' | 'listing'

export interface SavedSearchRow {
  id: string
  user_id: string
  name: string
  entity_type: SavedEntity
  criteria: Record<string, unknown>
  is_active: boolean
  last_matched_at: string | null
  created_at: string
  updated_at: string
}

interface FormCriteria {
  city?: string
  origin_city?: string
  radius_km?: number
  ethnicity?: string
  nationality?: string
  gender?: string
  hair_color?: string
  services?: string[]
  languages?: string[]
  age_min?: number
  age_max?: number
  listing_type?: 'job' | 'rent'
  club_area?: string
}

const ETHNICITIES = ['asian', 'black', 'caucasian_white', 'latin', 'mixed', 'indian', 'arab', 'caucasian']
const HAIR_COLORS = ['blond', 'light_brown', 'brunette', 'black', 'red', 'other']
const GENDERS = ['female', 'male', 'trans']
const LANGUAGES = ['English', 'German', 'French', 'Italian', 'Spanish', 'Portuguese', 'Russian', 'Romanian', 'Polish', 'Hungarian', 'Croatian', 'Serbian']

interface ServiceRow { id: number | string; name: string }

const cap = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

export default function SavedSearchForm({ existing }: { existing?: SavedSearchRow }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [services, setServices] = useState<ServiceRow[]>([])

  const [name, setName] = useState(existing?.name || '')
  const [entityType, setEntityType] = useState<SavedEntity>(existing?.entity_type || 'model')
  const [isActive, setIsActive] = useState(existing?.is_active ?? true)
  const [criteria, setCriteria] = useState<FormCriteria>((existing?.criteria as FormCriteria) || {})

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('services').select('id, name').order('name')
      if (data) setServices(data as ServiceRow[])
    }
    run()
  }, [])

  const nearbyValue: NearbyValue = useMemo(
    () => ({ originCity: criteria.origin_city || null, radiusKm: criteria.radius_km || null }),
    [criteria.origin_city, criteria.radius_km],
  )

  const setNearby = (v: NearbyValue) => {
    setCriteria(c => ({ ...c, origin_city: v.originCity || undefined, radius_km: v.radiusKm || undefined }))
  }

  const toggleArray = (key: 'services' | 'languages', value: string) => {
    setCriteria(c => {
      const list = new Set(c[key] || [])
      if (list.has(value)) list.delete(value)
      else list.add(value)
      return { ...c, [key]: Array.from(list) }
    })
  }

  const cleanCriteria = (c: FormCriteria): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    if (c.city) out.city = c.city
    if (c.origin_city && c.radius_km) { out.origin_city = c.origin_city; out.radius_km = c.radius_km }
    if (c.ethnicity) out.ethnicity = c.ethnicity
    if (c.nationality) out.nationality = c.nationality
    if (c.gender) out.gender = c.gender
    if (c.hair_color) out.hair_color = c.hair_color
    if (c.services && c.services.length) out.services = c.services
    if (c.languages && c.languages.length) out.languages = c.languages
    if (c.age_min != null) out.age_min = c.age_min
    if (c.age_max != null) out.age_max = c.age_max
    if (c.listing_type) out.listing_type = c.listing_type
    if (c.club_area) out.club_area = c.club_area
    return out
  }

  const runPreview = async () => {
    setPreviewLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('preview_saved_search', {
        p_entity_type: entityType,
        p_criteria: cleanCriteria(criteria),
      })
      if (error) {
        console.error('preview error:', error)
        setPreviewCount(null)
      } else {
        setPreviewCount(typeof data === 'number' ? data : 0)
      }
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const payload = {
        user_id: user.id,
        name: name.trim(),
        entity_type: entityType,
        criteria: cleanCriteria(criteria),
        is_active: isActive,
      }

      if (existing) {
        const { error } = await supabase.from('saved_searches').update(payload).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('saved_searches').insert(payload)
        if (error) throw error
      }
      router.push('/dashboard/user/saved-searches')
      router.refresh()
    } catch (err) {
      console.error('Save error:', err)
      alert('Could not save the search. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!existing) return
    if (!confirm('Delete this saved search? You will stop receiving alerts for it.')) return
    setDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('saved_searches').delete().eq('id', existing.id)
      if (error) throw error
      router.push('/dashboard/user/saved-searches')
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100'
  const labelCls = 'block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>Name</label>
            <input
              className={inputCls}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder='e.g. "African models in Zurich"'
              required
              maxLength={80}
            />
          </div>
          <div>
            <label className={labelCls}>Search for</label>
            <select
              className={inputCls}
              value={entityType}
              onChange={e => { setEntityType(e.target.value as SavedEntity); setPreviewCount(null) }}
            >
              <option value="model">Models</option>
              <option value="club">Clubs</option>
              <option value="listing">Jobs / Rent listings</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-400"
          />
          Alert me when new matches appear
        </label>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <p className="text-sm font-bold text-gray-900">Criteria</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>City (exact match)</label>
            <input
              className={inputCls}
              value={criteria.city || ''}
              onChange={e => setCriteria(c => ({ ...c, city: e.target.value || undefined }))}
              placeholder="e.g. Zurich"
            />
          </div>
          <div>
            <label className={labelCls}>Nearby (origin + radius)</label>
            <NearbyFilter value={nearbyValue} onChange={setNearby} compact />
          </div>
        </div>

        {entityType === 'model' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={labelCls}>Ethnicity</label>
                <select
                  className={inputCls}
                  value={criteria.ethnicity || ''}
                  onChange={e => setCriteria(c => ({ ...c, ethnicity: e.target.value || undefined }))}
                >
                  <option value="">Any</option>
                  {ETHNICITIES.map(v => <option key={v} value={v}>{cap(v)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Hair color</label>
                <select
                  className={inputCls}
                  value={criteria.hair_color || ''}
                  onChange={e => setCriteria(c => ({ ...c, hair_color: e.target.value || undefined }))}
                >
                  <option value="">Any</option>
                  {HAIR_COLORS.map(v => <option key={v} value={v}>{cap(v)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select
                  className={inputCls}
                  value={criteria.gender || ''}
                  onChange={e => setCriteria(c => ({ ...c, gender: e.target.value || undefined }))}
                >
                  <option value="">Any</option>
                  {GENDERS.map(v => <option key={v} value={v}>{cap(v)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Nationality</label>
                <input
                  className={inputCls}
                  value={criteria.nationality || ''}
                  onChange={e => setCriteria(c => ({ ...c, nationality: e.target.value || undefined }))}
                  placeholder="e.g. Brazilian"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Min age</label>
                <input
                  type="number"
                  className={inputCls}
                  min={18}
                  max={80}
                  value={criteria.age_min ?? ''}
                  onChange={e => setCriteria(c => ({ ...c, age_min: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div>
                <label className={labelCls}>Max age</label>
                <input
                  type="number"
                  className={inputCls}
                  min={18}
                  max={80}
                  value={criteria.age_max ?? ''}
                  onChange={e => setCriteria(c => ({ ...c, age_max: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Services (all required)</label>
              <div className="flex flex-wrap gap-1.5">
                {services.map(s => {
                  const selected = criteria.services?.includes(s.name) ?? false
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleArray('services', s.name)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        selected
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
                      }`}
                    >
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelCls}>Languages (all required)</label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map(l => {
                  const selected = criteria.languages?.includes(l) ?? false
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => toggleArray('languages', l)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        selected
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
                      }`}
                    >
                      {l}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {entityType === 'club' && (
          <div>
            <label className={labelCls}>Club area</label>
            <input
              className={inputCls}
              value={criteria.club_area || ''}
              onChange={e => setCriteria(c => ({ ...c, club_area: e.target.value || undefined }))}
              placeholder="e.g. Zurich West"
            />
          </div>
        )}

        {entityType === 'listing' && (
          <div>
            <label className={labelCls}>Listing type</label>
            <div className="flex gap-2">
              {([
                { v: undefined as 'job' | 'rent' | undefined, l: 'Any' },
                { v: 'job' as const, l: 'Jobs only' },
                { v: 'rent' as const, l: 'Rent only' },
              ]).map(({ v, l }) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setCriteria(c => ({ ...c, listing_type: v }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    criteria.listing_type === v
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runPreview}
          disabled={previewLoading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 disabled:opacity-50"
        >
          {previewLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Test search
        </button>
        {previewCount !== null && (
          <p className="text-sm text-gray-700">
            Currently <span className="font-bold text-violet-700">{previewCount}</span> {entityType}
            {previewCount === 1 ? '' : 's'} match these criteria.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {existing ? 'Save changes' : 'Create saved search'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/user/saved-searches')}
            className="px-4 py-2 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  )
}
