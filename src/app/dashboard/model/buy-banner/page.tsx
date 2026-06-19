'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  Megaphone, Upload, X, CheckCircle, AlertCircle, Trash2,
  ShoppingCart, Zap, ChevronRight,
} from 'lucide-react'
import BannerPlacementPreview from '@/components/buy-banner/BannerPlacementPreview'
import PlacementPicker from '@/components/buy-banner/PlacementPicker'
import BannerLivePreview from '@/components/buy-banner/BannerLivePreview'
import BannerImage from '@/components/home/BannerImage'
import CantonMultiSelect from '@/components/buy-banner/CantonMultiSelect'
import TermsAcceptance from '@/components/ui/TermsAcceptance'
import type { BannerPlacement } from '@/lib/bannerPlacement'
import { normalizePlacement } from '@/lib/bannerPlacement'
import { checkActiveAd } from '@/lib/activeAd'
import {
  type BannerRegionPriceRow,
  fetchBannerRegionPricing,
  findBannerPrice,
} from '@/lib/bannerPricing'
import { MAX_BANNER_REGIONS } from '@/lib/cantons'

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
  placement?: string | null
  target_cantons?: string[] | null
}

function activePlacementsFromRows(rows: BannerRow[]): Set<BannerPlacement> {
  const now = new Date()
  const set = new Set<BannerPlacement>()
  for (const b of rows) {
    if (b.status !== 'active') continue
    if (b.expires_at && new Date(b.expires_at) <= now) continue
    set.add(normalizePlacement(b.placement))
  }
  return set
}

export default function ModelBuyBannerPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.model.buyBanner')
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [user, setUser] = useState<any>(null)
  const [packages, setPackages] = useState<Product[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null)
  const [banners, setBanners] = useState<BannerRow[]>([])
  const [activeSlots, setActiveSlots] = useState<Set<BannerPlacement>>(new Set())
  const [hasActiveAd, setHasActiveAd] = useState(false)

  const [selectedPlacement, setSelectedPlacement] = useState<BannerPlacement | null>(null)
  const [selectedCantons, setSelectedCantons] = useState<string[]>([])
  const [pricing, setPricing] = useState<BannerRegionPriceRow[]>([])
  const [ctaUrl, setCtaUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const afterPlacementRef = useRef<HTMLDivElement | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const slotFreeForSelection = useMemo(() => {
    if (!selectedPlacement) return false
    return !activeSlots.has(selectedPlacement)
  }, [selectedPlacement, activeSlots])

  const uploadHint = useMemo(() => {
    if (selectedPlacement === 'feed_card') return t('uploadHintFeedCard')
    if (selectedPlacement === 'sidebar_left') return t('uploadHintSidebar')
    return t('uploadHintWide')
  }, [selectedPlacement, t])

  const previewAspectClass = useMemo(() => {
    if (selectedPlacement === 'feed_card') return 'aspect-[3/4] max-w-xs mx-auto'
    if (selectedPlacement === 'sidebar_left') return 'aspect-[2/3] max-w-xs mx-auto'
    return 'aspect-[4/1]'
  }, [selectedPlacement])

  const uploadAspectClass = useMemo(() => {
    if (selectedPlacement === 'feed_card') return 'aspect-[3/4] max-w-xs mx-auto'
    if (selectedPlacement === 'sidebar_left') return 'aspect-[2/3] max-w-xs mx-auto'
    return 'aspect-[4/1] max-w-lg mx-auto'
  }, [selectedPlacement])

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!selectedPlacement) return
    const timer = window.setTimeout(() => {
      afterPlacementRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [selectedPlacement, selectedPackage])

  const load = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const [{ data: bannersData }, { data: pkgData }, adStatus, pricingRows] = await Promise.all([
        supabase.from('banners').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('product_type', 'banner_package').eq('is_active', true).order('display_order'),
        checkActiveAd(supabase, user.id),
        fetchBannerRegionPricing(supabase),
      ])

      if (bannersData) {
        setBanners(bannersData as BannerRow[])
        setActiveSlots(activePlacementsFromRows(bannersData as BannerRow[]))
      }
      if (pkgData) setPackages(pkgData)
      setHasActiveAd(adStatus.hasActiveAd)
      setPricing(pricingRows)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const currentPrice = useMemo(
    () =>
      findBannerPrice(
        pricing,
        selectedPlacement,
        selectedPackage?.duration_days ?? null,
        selectedCantons.length,
      ),
    [pricing, selectedPlacement, selectedPackage, selectedCantons.length],
  )

  const formatPrice = (chf: number | null) => {
    if (chf == null) return '—'
    return `CHF ${chf.toFixed(2)}`
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError(t('errImageTooLarge')); return }
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
    if (!selectedPlacement) { setError(t('errSelectPlacement')); return }
    if (activeSlots.has(selectedPlacement)) { setError(t('errSlotTaken')); return }
    if (selectedCantons.length === 0) { setError(t('errSelectRegion')); return }
    if (!selectedPackage) { setError(t('errSelectPackage')); return }
    if (!imageFile) { setError(t('errUploadImage')); return }
    if (!termsAccepted) { setError(t('errAcceptTerms')); return }
    if (currentPrice == null || currentPrice <= 0) {
      setError(t('errPricingMissing'))
      return
    }

    setSaving(true)
    try {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/banner-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('banners')
        .upload(path, imageFile, { cacheControl: '3600', upsert: true })
      if (upErr) throw upErr

      const { data: profile } = await supabase
        .from('model_details')
        .select('showname')
        .eq('model_id', user.id)
        .single()
      const title = profile?.showname || t('bannerFallbackTitle')

      const { data: draft, error: dbErr } = await supabase
        .from('banners')
        .insert({
          owner_id: user.id,
          owner_type: 'model',
          title,
          image_path: path,
          cta_url: ctaUrl.trim() || null,
          status: 'pending_payment',
          placement: selectedPlacement,
          target_cantons: selectedCantons,
        })
        .select()
        .single()
      if (dbErr || !draft) throw dbErr || new Error(t('errDraftFailed'))

      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnPath: '/dashboard/model/buy-banner',
          items: [{
            kind: 'banner',
            productId: selectedPackage.id,
            bannerId: draft.id,
            placement: selectedPlacement,
            imagePath: path,
            ctaUrl: ctaUrl.trim() || null,
            targetCantons: selectedCantons,
            ownerType: 'model',
            title,
          }],
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        await supabase.from('banners').delete().eq('id', draft.id)
        await supabase.storage.from('banners').remove([path])
        throw new Error(j?.error || t('errCheckoutFailed'))
      }
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch (e: any) {
      setError(e?.message || t('errActivateFailed'))
      setSaving(false)
    }
  }

  const handleDelete = async (banner: BannerRow) => {
    if (!confirm(t('confirmDelete'))) return
    try {
      if (banner.image_path) await supabase.storage.from('banners').remove([banner.image_path])
      await supabase.from('banners').delete().eq('id', banner.id)
      const updated = banners.filter(b => b.id !== banner.id)
      setBanners(updated)
      setActiveSlots(activePlacementsFromRows(updated))
    } catch (e: any) {
      setError(e?.message || t('errDeleteFailed'))
    }
  }

  const storageUrl = (path: string | null) =>
    path ? `${SUPA_URL}/storage/v1/object/public/banners/${path}` : null

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      pending:  { cls: 'bg-yellow-100 text-yellow-800', label: t('statusPending') },
      active:   { cls: 'bg-emerald-100 text-emerald-800', label: t('statusActive') },
      expired:  { cls: 'bg-gray-100 text-gray-600', label: t('statusExpired') },
      rejected: { cls: 'bg-red-100 text-red-800', label: t('statusRejected') },
    }
    const s = map[status] || map.pending
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  }

  const placementLabel = (p: string | null | undefined) => {
    const pl = normalizePlacement(p)
    if (pl === 'feed_card') return t('placementCard')
    if (pl === 'sidebar_left') return t('placementSidebar')
    return t('placementWide')
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4">

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-purple-100 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-xs text-gray-500">{t('subtitle')}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            {t.rich('infoBox', {
              bold: (chunks) => <span className="font-semibold">{chunks}</span>,
              em: (chunks) => <span className="font-medium">{chunks}</span>,
            })}
          </p>
        </div>

        <BannerPlacementPreview ownerType="model" />

        {!hasActiveAd && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 md:p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-900 mb-1">{t('tipTitle')}</p>
              <p className="text-sm text-blue-800 mb-3">{t('tipBody')}</p>
              <button
                onClick={() => router.push('/dashboard/model/activate-ad')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                {t('activateSedcard')}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

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

        {activeSlots.size > 0 && (
          <div className="bg-white border border-emerald-200 rounded-lg p-3.5 md:p-5 space-y-2">
            <p className="text-sm font-bold text-emerald-800">{t('activeBannerSlots')}</p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              {Array.from(activeSlots).map(pl => (
                <li key={pl}>
                  <span className="font-medium text-gray-800">{placementLabel(pl)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div data-tour="banner-placement" className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-4">
          <p className="text-sm font-bold text-gray-800">{t('step1')}</p>
          <PlacementPicker
            value={selectedPlacement}
            onChange={p => {
              setSelectedPlacement(p)
              setSelectedPackage(null)
              setSelectedCantons([])
              clearImage()
            }}
            disabledPlacements={activeSlots}
            previewUrl={imagePreview}
          />
        </div>

        {selectedPlacement && (
          <div ref={afterPlacementRef} className="space-y-4">
        {slotFreeForSelection && (
          <div data-tour="banner-regions" className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-4">
            <div>
              <p className="text-sm font-bold text-gray-800">{t('step2')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('step2Hint', { max: MAX_BANNER_REGIONS })}</p>
            </div>
            <CantonMultiSelect
              value={selectedCantons}
              onChange={setSelectedCantons}
              disabled={saving}
            />
          </div>
        )}

        {slotFreeForSelection && selectedCantons.length > 0 && (
          <div data-tour="banner-duration" className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
            <p className="text-sm font-bold text-gray-800 mb-4">{t('step3')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
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
                    <div className="p-3.5 md:p-5 text-center">
                      <p className="text-base font-bold text-gray-900 mb-1">{pkg.name}</p>
                      <p className="text-xs text-gray-400">{pkg.description}</p>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        {(() => {
                          const price = findBannerPrice(pricing, selectedPlacement, pkg.duration_days, MAX_BANNER_REGIONS)
                          return (
                            <>
                              <p className="text-base font-bold text-gray-900">{price != null ? `CHF ${price.toFixed(0)}.-` : '—'}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{t('oneTimePayment')}</p>
                            </>
                          )
                        })()}
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

        {slotFreeForSelection && selectedPackage && (
          <div data-tour="banner-upload" className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-4">
            <p className="text-sm font-bold text-gray-800">{t('step4')}</p>
            <p className="text-xs text-gray-400">{uploadHint}</p>
            {imagePreview ? (
              <div className={`relative rounded-xl overflow-hidden border border-gray-200 bg-slate-100 ${previewAspectClass}`}>
                <BannerImage src={imagePreview} alt={t('previewAlt')} plain />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className={`w-full border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-brand hover:text-brand transition-colors flex flex-col items-center justify-center gap-2 ${uploadAspectClass}`}
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">{t('clickToUpload')}</span>
                <span className="text-xs">JPG, PNG, WebP</span>
              </button>
            )}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">{t('linkOptional')}</label>
              <input
                type="url"
                value={ctaUrl}
                onChange={e => setCtaUrl(e.target.value)}
                placeholder={t('linkPlaceholder')}
                className="w-full max-w-lg px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {imagePreview && selectedPlacement && (
              <BannerLivePreview placement={selectedPlacement} previewUrl={imagePreview} />
            )}
          </div>
        )}

        {slotFreeForSelection && selectedPackage && imageFile && (
          <div data-tour="banner-confirm" className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-gray-800">{t('step5')}</p>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{t('total')}</p>
                <p className="text-base font-bold text-gray-900">{formatPrice(currentPrice)}</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{selectedPackage.name} — {placementLabel(selectedPlacement)}</p>
                  <p className="text-xs text-gray-500">{t('activateImmediately')}</p>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatPrice(currentPrice)}</span>
              </div>
              <div className="text-xs text-gray-500">
                {t.rich('targeting', {
                  count: selectedCantons.length,
                  bold: (chunks) => <span className="font-semibold text-gray-700">{chunks}</span>,
                })}
              </div>
            </div>
            <div className="mb-3">
              <TermsAcceptance
                checked={termsAccepted}
                onChange={setTermsAccepted}
                disabled={saving}
              />
            </div>
            <button
              onClick={handleActivate}
              disabled={saving || !termsAccepted}
              className="w-full py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              {saving ? t('redirecting') : t('paySecurely')}
            </button>
          </div>
        )}

        {!slotFreeForSelection && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            {t.rich('alreadyActive', {
              placement: placementLabel(selectedPlacement),
              bold: (chunks) => <span className="font-semibold">{chunks}</span>,
            })}
          </div>
        )}
          </div>
        )}

        {banners.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">{t('yourBanners')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {banners.map(banner => (
                <div key={banner.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                  {banner.image_path && (
                    <div
                      className={`relative w-full bg-slate-100 ${
                        normalizePlacement(banner.placement) === 'feed_wide'
                          ? 'aspect-[4/1]'
                          : normalizePlacement(banner.placement) === 'sidebar_left'
                            ? 'aspect-[2/3] max-h-96 mx-auto'
                            : 'aspect-[3/4] max-h-80 mx-auto'
                      }`}
                    >
                      <BannerImage src={storageUrl(banner.image_path)!} alt={t('bannerFallbackTitle')} plain />
                    </div>
                  )}
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-violet-700">{placementLabel(banner.placement)}</span>
                      {statusBadge(banner.status)}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(banner.created_at).toLocaleDateString()}
                      </p>
                      {banner.expires_at && (
                        <p className="text-xs text-gray-400">
                          {t('expires', { date: new Date(banner.expires_at).toLocaleDateString() })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(banner)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      title={t('deleteTitle')}
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
