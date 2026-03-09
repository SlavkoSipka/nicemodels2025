'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Megaphone, Upload, X, CheckCircle, AlertCircle, Trash2,
  ShoppingCart,
} from 'lucide-react'

interface Product {
  id: string
  product_type: string
  name: string
  description: string
  price_chf: number
  duration_days: number
  duration_hours: number
  discount_percent: number
  is_active: boolean
}

interface BannerRow {
  id: string
  title: string
  image_path: string | null
  cta_url: string | null
  status: string
  starts_at: string | null
  expires_at: string | null
  created_at: string
}

export default function BuyBannerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [user, setUser] = useState<any>(null)
  const [clubDetails, setClubDetails] = useState<any>(null)
  const [packages, setPackages] = useState<Product[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null)
  const [hasActiveBanner, setHasActiveBanner] = useState(false)
  const [activeBannerExpiry, setActiveBannerExpiry] = useState<string | null>(null)
  const [banners, setBanners] = useState<BannerRow[]>([])

  const [ctaUrl, setCtaUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const [{ data: details }, { data: bannersData }, { data: pkgData }] = await Promise.all([
        supabase.from('club_details').select('*').eq('club_id', user.id).single(),
        supabase.from('banners').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('product_type', 'banner_package').eq('is_active', true).order('display_order'),
      ])

      if (details) setClubDetails(details)
      if (bannersData) {
        setBanners(bannersData)
        const now = new Date()
        const active = bannersData.find((b: BannerRow) => {
          if (b.status !== 'active') return false
          if (b.expires_at && new Date(b.expires_at) <= now) return false
          return true
        })
        if (active) {
          setHasActiveBanner(true)
          if (active.expires_at) {
            setActiveBannerExpiry(new Date(active.expires_at).toLocaleDateString('en-CH', {
              day: 'numeric', month: 'long', year: 'numeric',
            }))
          }
        }
      }
      if (pkgData) setPackages(pkgData)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image too large. Max 10MB.'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handleActivate = async () => {
    setError(''); setSuccess('')
    if (!selectedPackage) { setError('Please select a package'); return }
    if (!imageFile) { setError('Please upload a banner image'); return }

    setSaving(true)
    try {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/banner-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('banners')
        .upload(path, imageFile, { cacheControl: '3600', upsert: true })
      if (upErr) throw upErr

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({ user_id: user.id, status: 'paid', total_amount: 0, payment_method: 'card' })
        .select()
        .single()
      if (orderError || !order) throw orderError || new Error('Failed to create order')

      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: selectedPackage.id,
          price_chf: 0,
          activation_type: 'immediately',
          activation_date: null,
        })
      if (itemError) throw itemError

      const title = clubDetails?.club_name || 'Banner'
      const now = new Date()
      const expiresAt = new Date(now.getTime() + selectedPackage.duration_days * 86400000).toISOString()

      const { data: newBanner, error: dbErr } = await supabase
        .from('banners')
        .insert({
          owner_id: user.id,
          owner_type: 'club',
          title,
          image_path: path,
          cta_url: ctaUrl.trim() || null,
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt,
        })
        .select()
        .single()
      if (dbErr) throw dbErr

      setBanners([newBanner, ...banners])
      setHasActiveBanner(true)
      setActiveBannerExpiry(new Date(expiresAt).toLocaleDateString('en-CH', {
        day: 'numeric', month: 'long', year: 'numeric',
      }))
      setSuccess('Banner activated successfully!')
      setSelectedPackage(null)
      clearImage()
      setCtaUrl('')
      setTimeout(() => setSuccess(''), 5000)
    } catch (e: any) {
      setError(e?.message || 'Failed to activate banner')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (banner: BannerRow) => {
    if (!confirm('Delete this banner?')) return
    try {
      if (banner.image_path) await supabase.storage.from('banners').remove([banner.image_path])
      await supabase.from('banners').delete().eq('id', banner.id)
      const updated = banners.filter(b => b.id !== banner.id)
      setBanners(updated)
      if (banner.status === 'active') {
        const now = new Date()
        const stillActive = updated.some(b =>
          b.status === 'active' && (!b.expires_at || new Date(b.expires_at) > now)
        )
        if (!stillActive) {
          setHasActiveBanner(false)
          setActiveBannerExpiry(null)
        }
      }
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

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Buy Banner</h1>
            <p className="text-xs text-gray-500">
              Beta phase — banners are <span className="font-semibold text-emerald-600">100% free</span>
            </p>
          </div>
        </div>

        {/* Beta info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-900">
            <span className="font-bold">Beta Info:</span> Banner placement is currently{' '}
            <span className="font-semibold">free for early clubs</span>.
            No payment required. We will clearly inform you before any pricing starts.
          </p>
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

        {/* Active banner status */}
        {hasActiveBanner && (
          <div className="bg-white border border-emerald-200 rounded-lg p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 mb-1">Your banner is currently active</p>
              <p className="text-sm text-gray-600">
                Your club banner is live on the homepage.
              </p>
              {activeBannerExpiry && (
                <p className="text-xs text-gray-400 mt-1">Active until: {activeBannerExpiry}</p>
              )}
            </div>
          </div>
        )}

        {/* Package selection */}
        {!hasActiveBanner && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-bold text-gray-800 mb-4">1. Select duration:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id

                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand bg-brand/5 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-brand/50'
                    }`}
                  >
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap text-white bg-emerald-500">
                      Beta — Free
                    </div>
                    <div className="p-5 text-center">
                      <p className="text-base font-bold text-gray-900 mb-1">{pkg.name}</p>
                      <p className="text-xs text-gray-400">{pkg.description}</p>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-sm font-bold text-emerald-600">Free</p>
                        <p className="text-xs text-gray-400 mt-0.5">No payment needed</p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute bottom-2.5 right-2.5 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Banner image upload */}
        {!hasActiveBanner && selectedPackage && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <p className="text-sm font-bold text-gray-800">2. Upload banner image:</p>
            <p className="text-xs text-gray-400">
              Recommended: wide landscape ratio (4:1). Max 10MB. JPG, PNG, WebP.
            </p>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 max-w-lg">
                <img src={imagePreview} alt="Preview" className="w-full aspect-[4/1] object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full max-w-lg aspect-[4/1] border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-brand hover:text-brand transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">Click to upload banner</span>
                <span className="text-xs">JPG, PNG, WebP</span>
              </button>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Link (optional)</label>
              <input
                type="url"
                value={ctaUrl}
                onChange={e => setCtaUrl(e.target.value)}
                placeholder="https://... or leave empty for your club profile"
                className="w-full max-w-lg px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        )}

        {/* Confirm activation */}
        {!hasActiveBanner && selectedPackage && imageFile && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-800">3. Confirm:</p>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">Total (beta):</p>
                <p className="text-base font-bold text-emerald-600">Free</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedPackage.name} — Banner</p>
                  <p className="text-xs text-gray-500">Activate immediately</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">Free</span>
              </div>
            </div>
            <button
              onClick={handleActivate}
              disabled={saving}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {saving ? 'Activating...' : 'Confirm free activation (beta)'}
            </button>
          </div>
        )}

        {/* Existing banners */}
        {banners.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Your Banners</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banners.map(banner => (
                <div key={banner.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                  {banner.image_path && (
                    <img src={storageUrl(banner.image_path)!} alt="Banner" className="w-full aspect-[4/1] object-cover" />
                  )}
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      {statusBadge(banner.status)}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(banner.created_at).toLocaleDateString()}
                      </p>
                      {banner.expires_at && (
                        <p className="text-xs text-gray-400">
                          Expires: {new Date(banner.expires_at).toLocaleDateString()}
                        </p>
                      )}
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
