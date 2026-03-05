'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Upload, X, Save, CheckCircle, AlertCircle, Trash2, MapPin } from 'lucide-react'

interface BannerRow {
  id: string
  title: string
  image_path: string | null
  cta_url: string | null
  status: string
  created_at: string
}

export default function BuyBannerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [clubDetails, setClubDetails] = useState<any>(null)
  const [banners, setBanners] = useState<BannerRow[]>([])

  const [ctaUrl, setCtaUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)

        const [{ data: details }, { data: bannersData }] = await Promise.all([
          supabase.from('club_details').select('*').eq('club_id', user.id).single(),
          supabase.from('banners').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        ])

        if (details) setClubDetails(details)
        if (bannersData) setBanners(bannersData)
        setLoading(false)
      } catch { setLoading(false) }
    }
    load()
  }, [router])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image too large. Max 10MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleCreate = async () => {
    setError(''); setSuccess('')
    if (!imageFile) { setError('Please upload a banner image'); return }

    setSaving(true)
    try {
      const supabase = createClient()

      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/banner-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('banners').upload(path, imageFile, { cacheControl: '3600', upsert: true })
      if (upErr) throw upErr

      const title = clubDetails?.club_name || 'Banner'

      const { data: newBanner, error: dbErr } = await supabase.from('banners').insert({
        owner_id: user.id,
        owner_type: 'club',
        title,
        image_path: path,
        cta_url: ctaUrl.trim() || null,
        status: 'pending',
      }).select().single()

      if (dbErr) throw dbErr

      setBanners([newBanner, ...banners])
      setSuccess('Banner submitted! Our team will review and activate it.')
      setImageFile(null); setImagePreview(null); setCtaUrl('')
      if (imageInputRef.current) imageInputRef.current.value = ''
      setTimeout(() => setSuccess(''), 5000)
    } catch (e: any) {
      setError(e?.message || 'Failed to create banner')
    } finally { setSaving(false) }
  }

  const handleDelete = async (banner: BannerRow) => {
    if (!confirm('Delete this banner?')) return
    try {
      const supabase = createClient()
      if (banner.image_path) await supabase.storage.from('banners').remove([banner.image_path])
      await supabase.from('banners').delete().eq('id', banner.id)
      setBanners(banners.filter(b => b.id !== banner.id))
    } catch (e: any) {
      setError(e?.message || 'Failed to delete banner')
    }
  }

  const storageUrl = (path: string | null) =>
    path ? `${SUPA_URL}/storage/v1/object/public/banners/${path}` : null

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      pending:  { cls: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      active:   { cls: 'bg-emerald-100 text-emerald-800', label: 'Active' },
      expired:  { cls: 'bg-gray-100 text-gray-600', label: 'Expired' },
      rejected: { cls: 'bg-red-100 text-red-800', label: 'Rejected' },
    }
    const s = map[status] || map.pending
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Buy Banner</h1>
            <p className="text-xs text-gray-500">Upload a banner image that will appear on the homepage between model cards</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-800">{success}</p>
          </div>
        )}

        {/* Upload form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-gray-900">Create New Banner</h2>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Banner Image <span className="text-pink-600">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Upload your designed banner image. Recommended: 3:4 portrait ratio (same as model cards). Max 10MB.
            </p>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 max-w-xs">
                <img src={imagePreview} alt="Preview" className="w-full aspect-[3/4] object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); if (imageInputRef.current) imageInputRef.current.value = '' }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full max-w-xs aspect-[3/4] border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-brand hover:text-brand transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Click to upload banner</span>
                <span className="text-xs">JPG, PNG, WebP</span>
              </button>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Link (optional)</label>
            <input
              type="url"
              value={ctaUrl}
              onChange={e => setCtaUrl(e.target.value)}
              placeholder="https://... or leave empty for your club profile"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={saving || !imageFile}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Uploading...' : 'Submit Banner'}
            </button>
          </div>
        </div>

        {/* Existing banners */}
        {banners.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Your Banners</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banners.map(banner => (
                <div key={banner.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                  {banner.image_path && (
                    <img src={storageUrl(banner.image_path)!} alt={banner.title} className="w-full aspect-[3/4] object-cover" />
                  )}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      {statusBadge(banner.status)}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(banner.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(banner)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
