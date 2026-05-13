'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { processImage } from '@/lib/imageProcessor'
import CitySearch, { CityResult } from '@/components/ui/CitySearch'
import RichTextEditor from '@/components/ui/RichTextEditor'
import TermsAcceptance from '@/components/ui/TermsAcceptance'
import SitePreview from '@/components/preview/SitePreview'
import RegionsCheckboxList from '@/components/forms/RegionsCheckboxList'
import { ALL_REGION_IDS, type RegionId } from '@/lib/regions'
import { checkActiveAd } from '@/lib/activeAd'
import {
  Briefcase, ArrowLeft, MapPin, FileText, Upload, Phone,
  AlertCircle, CheckCircle, Trash2, Zap, Calendar, ChevronDown, ChevronUp,
  Home, DollarSign, Globe, Hash, Lock, ChevronRight,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price_chf: number
  duration_days: number
  duration_hours: number
}

interface ServiceItem {
  id: string
  name: string
  category: string
}

interface UploadedPhoto {
  file: File
  preview: string
}

interface Props {
  /** Where to send the user after submit / cancel. */
  backHref: string
  /** Successful create destination. Defaults to backHref. */
  successHref?: string
  /** Header subtitle text. */
  subtitle?: string
  /** Whether the form needs to pre-fill phone/email from a club_contact_details row. */
  prefillFromClubContact?: boolean
  /** Block creation unless the user has an active ad_package purchase. */
  requireActiveAd?: boolean
  /** Where to send the user to activate their ad. */
  activateAdHref?: string
}

export default function CreateJobRentForm({
  backHref,
  successHref,
  subtitle,
  prefillFromClubContact = false,
  requireActiveAd = false,
  activateAdHref = '/dashboard/company/activate-ad',
}: Props) {
  const t = useTranslations('components.createJobRentForm')
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [listingType, setListingType] = useState<'job' | 'rent'>('job')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [locationPostalCode, setLocationPostalCode] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [description, setDescription] = useState('')
  const [regions, setRegions] = useState<RegionId[]>([...ALL_REGION_IDS])

  const [photos, setPhotos] = useState<UploadedPhoto[]>([])

  const [rentPriceDaily, setRentPriceDaily] = useState('')
  const [rentPriceWeekly, setRentPriceWeekly] = useState('')
  const [rentPriceMonthly, setRentPriceMonthly] = useState('')
  const [rentWorkPermit, setRentWorkPermit] = useState(false)
  const [rentRoomSize, setRentRoomSize] = useState('')
  const [rentFurnished, setRentFurnished] = useState(false)
  const [rentKitchen, setRentKitchen] = useState(false)
  const [rentBathroom, setRentBathroom] = useState(false)
  const [rentAirConditioning, setRentAirConditioning] = useState(false)
  const [rentTowels, setRentTowels] = useState(false)

  const [countryCode, setCountryCode] = useState('+41')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [hasWhatsapp, setHasWhatsapp] = useState(false)
  const [hasViber, setHasViber] = useState(false)
  const [hasTelegram, setHasTelegram] = useState(false)
  const [hasSms, setHasSms] = useState(false)
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')

  const [allServices, setAllServices] = useState<ServiceItem[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [servicesOpen, setServicesOpen] = useState(false)

  const [packages, setPackages] = useState<Product[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null)
  const [activationType, setActivationType] = useState<'immediately' | 'at_date'>('immediately')
  const [activationDate, setActivationDate] = useState('')
  const [hasActiveAd, setHasActiveAd] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      if (requireActiveAd) {
        const status = await checkActiveAd(supabase, user.id)
        setHasActiveAd(status.hasActiveAd)
      }

      if (prefillFromClubContact) {
        const { data: contact } = await supabase
          .from('club_contact_details')
          .select('*')
          .eq('club_id', user.id)
          .maybeSingle()
        if (contact) {
          setCountryCode(contact.country_code || '+41')
          setPhoneNumber(contact.phone_number || '')
          setHasWhatsapp(contact.has_whatsapp || false)
          setHasViber(contact.has_viber || false)
          setHasTelegram(contact.has_telegram || false)
          setEmail(contact.email || '')
          setWebsite(contact.website || '')
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, phone')
          .eq('id', user.id)
          .single()
        if (profile?.email) setEmail(profile.email)
        if (profile?.phone) setPhoneNumber(profile.phone)
      }

      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, category')
        .order('category')
        .order('name')
      if (servicesData) setAllServices(servicesData)

      const { data: pkgData } = await supabase
        .from('products')
        .select('*')
        .eq('product_type', 'job_package')
        .eq('is_active', true)
        .order('display_order')

      if (pkgData) {
        const seen = new Set<number>()
        // Keep canonical 5/14/30 durations only and hide rows where price
        // hasn't been seeded yet (price_chf = 0) so we never render
        // "CHF 0.-" on the duration cards. Dedupe by duration_days so legacy
        // duplicate rows ("14 Days" vs "14 days") collapse to one card.
        const filtered = pkgData.filter(p => {
          if (Number(p.price_chf) <= 0) return false
          if (![5, 14, 30].includes(p.duration_days)) return false
          if (seen.has(p.duration_days)) return false
          seen.add(p.duration_days)
          return true
        })
        setPackages(filtered)
      }

      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const newPhotos = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ''
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].preview)
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const servicesByCategory = allServices.reduce<Record<string, ServiceItem[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  const handleSubmit = async () => {
    if (!user) return
    if (requireActiveAd && !hasActiveAd) { setError(t('errNeedActiveAd')); return }
    if (!title.trim()) { setError(t('errTitleRequired')); return }
    if (!location.trim()) { setError(t('errCityRequired')); return }
    if (!description.trim()) { setError(t('errDescriptionRequired')); return }
    if (!phoneNumber.trim() && !email.trim()) {
      setError(t('errContactRequired'))
      return
    }
    if (!selectedPackage) { setError(t('errSelectPackage')); return }
    if (!termsAccepted) { setError(t('errTermsRequired')); return }
    if (!Number(selectedPackage.price_chf)) {
      setError(t('errPackageUnavailable'))
      return
    }

    const finalRegions: RegionId[] = regions.length === 0 ? [...ALL_REGION_IDS] : regions

    setError('')
    setSubmitting(true)

    let createdListingId: string | null = null
    let uploadedPhotoPaths: string[] = []

    try {
      const actDate = activationType === 'at_date' && activationDate
        ? new Date(activationDate).toISOString()
        : null

      // 1. Create the listing in pending_payment so photos/services have a
      //    target row. Webhook flips it to 'active' on payment success.
      const { data: listing, error: listingErr } = await supabase
        .from('job_listings')
        .insert({
          club_id: user.id,
          listing_type: listingType,
          title: title.trim(),
          location: location.trim(),
          regions: finalRegions,
          address_street: addressStreet.trim() || null,
          address_number: addressNumber.trim() || null,
          description: description.trim(),
          country_code: countryCode,
          phone_number: phoneNumber.trim() || null,
          has_whatsapp: hasWhatsapp,
          has_viber: hasViber,
          has_telegram: hasTelegram,
          has_sms: hasSms,
          email: email.trim() || null,
          website: website.trim() || null,
          status: 'pending_payment',
          ...(listingType === 'rent' ? {
            rent_price_daily: rentPriceDaily ? parseFloat(rentPriceDaily) : null,
            rent_price_weekly: rentPriceWeekly ? parseFloat(rentPriceWeekly) : null,
            rent_price_monthly: rentPriceMonthly ? parseFloat(rentPriceMonthly) : null,
            rent_work_permit: rentWorkPermit,
            rent_room_size: rentRoomSize.trim() || null,
            rent_furnished: rentFurnished,
            rent_kitchen: rentKitchen,
            rent_bathroom: rentBathroom,
            rent_air_conditioning: rentAirConditioning,
            rent_towels: rentTowels,
          } : {}),
        })
        .select()
        .single()
      if (listingErr || !listing) throw listingErr || new Error(t('errCreateFailed'))
      createdListingId = listing.id

      // 2. Upload photos and tag services to the draft listing.
      for (let i = 0; i < photos.length; i++) {
        const raw = photos[i].file
        let processed: File
        try { processed = await processImage(raw) } catch { continue }
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`
        const filePath = `${user.id}/${listing.id}/${fileName}`
        const { error: upErr } = await supabase.storage
          .from('job-listing-photos')
          .upload(filePath, processed, { contentType: 'image/webp', cacheControl: '3600', upsert: false })
        if (upErr) continue
        uploadedPhotoPaths.push(filePath)
        await supabase.from('job_listing_photos').insert({
          listing_id: listing.id,
          file_path: filePath,
          file_name: raw.name,
          display_order: i,
        })
      }

      if (selectedServices.length > 0) {
        await supabase.from('job_listing_services').insert(
          selectedServices.map(sid => ({ listing_id: listing.id, service_id: sid }))
        )
      }

      // 3. Hand off to Stripe Checkout. Webhook flips listing to 'active'
      //    on success; cancel/expiry leaves it as cancelled draft.
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnPath: backHref,
          items: [{
            kind: 'job_listing',
            productId: selectedPackage.id,
            listingId: listing.id,
            activationType,
            activationDate: actDate,
          }],
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || t('errCheckoutFailed'))
      }
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch (err: any) {
      // Roll back the draft listing + uploaded files so the user can retry
      // without orphan rows piling up.
      if (createdListingId) {
        await supabase.from('job_listings').delete().eq('id', createdListingId)
      }
      if (uploadedPhotoPaths.length) {
        await supabase.storage.from('job-listing-photos').remove(uploadedPhotoPaths)
      }
      setError(err.message || t('errCreateFailed'))
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-0 md:ml-[280px]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-3 md:py-6 px-3 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-3 md:space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-xl font-bold text-gray-900 truncate">{t('title')}</h1>
            <p className="text-[11px] md:text-xs text-gray-500 truncate">{subtitle ?? t('subtitleFallback')}</p>
          </div>
          <button
            onClick={() => router.push(backHref)}
            className="shrink-0 flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </button>
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

        {requireActiveAd && !hasActiveAd && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 md:p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900 mb-1">{t('activateAdTitle')}</p>
              <p className="text-sm text-amber-800 mb-3">
                {t('activateAdBody')}
              </p>
              <button
                onClick={() => router.push(activateAdHref)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                {t('activateSedcardCta')}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {(!requireActiveAd || hasActiveAd) && (<>

        {/* Section: About */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionAbout')}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('typeLabel')}</label>
            <div className="flex gap-2">
              {(['job', 'rent'] as const).map(kind => (
                <button
                  key={kind}
                  onClick={() => setListingType(kind)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    listingType === kind
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {kind === 'job' ? t('typeJob') : t('typeRent')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('titleLabel')}</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('titlePlaceholder')}
              maxLength={200}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('cityLabel')}</label>
            <CitySearch
              value={location}
              postalCode={locationPostalCode}
              onChange={(city: CityResult | null) => {
                setLocation(city?.name || '')
                setLocationPostalCode(city?.postal_code || '')
              }}
              placeholder={t('cityPlaceholder')}
              inputClassName="border-gray-200 focus:ring-brand"
            />
          </div>

          {/* Address — optional */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('streetLabel')} <span className="font-normal text-gray-400">{t('optionalTag')}</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={addressStreet}
                  onChange={e => setAddressStreet(e.target.value)}
                  placeholder={t('streetPlaceholder')}
                  maxLength={120}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('numberLabel')} <span className="font-normal text-gray-400">{t('optionalTag')}</span>
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={addressNumber}
                  onChange={e => setAddressNumber(e.target.value)}
                  placeholder={t('numberPlaceholder')}
                  maxLength={10}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Visibility (regions) */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionVisibility')}</p>
            <span className="text-xs text-gray-400">{t('visibilityHint')}</span>
          </div>
          <RegionsCheckboxList selected={regions} onChange={setRegions} />
        </div>

        <SitePreview
          page="jobs-rents"
          highlight={listingType === 'job' ? 'listing-job' : 'listing-rent'}
          title={listingType === 'job' ? t('previewTitleJob') : t('previewTitleRent')}
          listingTitle={title}
          listingLocation={location}
        />

        {/* Section: Rent Details */}
        {listingType === 'rent' && (
          <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                <Home className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-gray-800">{t('sectionRentDetails')}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-bold text-gray-700">{t('pricingChf')}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{t('perDay')}</label>
                  <input type="number" min="0" step="0.01" value={rentPriceDaily} onChange={e => setRentPriceDaily(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{t('perWeek')}</label>
                  <input type="number" min="0" step="0.01" value={rentPriceWeekly} onChange={e => setRentPriceWeekly(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{t('perMonth')}</label>
                  <input type="number" min="0" step="0.01" value={rentPriceMonthly} onChange={e => setRentPriceMonthly(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('roomSizeLabel')} <span className="font-normal text-gray-400">{t('optionalTag')}</span></label>
              <input type="text" value={rentRoomSize} onChange={e => setRentRoomSize(e.target.value)} placeholder={t('roomSizePlaceholder')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">{t('workPermitLabel')}</p>
              <button type="button" onClick={() => setRentWorkPermit(!rentWorkPermit)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${rentWorkPermit ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${rentWorkPermit ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                  {rentWorkPermit && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </span>
                {t('workPermitToggle')}
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">{t('amenitiesLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { amenityKey: 'amenityFurnished' as const, value: rentFurnished, set: setRentFurnished },
                  { amenityKey: 'amenityKitchen' as const, value: rentKitchen, set: setRentKitchen },
                  { amenityKey: 'amenityBathroom' as const, value: rentBathroom, set: setRentBathroom },
                  { amenityKey: 'amenityAc' as const, value: rentAirConditioning, set: setRentAirConditioning },
                  { amenityKey: 'amenityTowels' as const, value: rentTowels, set: setRentTowels },
                ] as const).map(({ amenityKey, value, set }) => (
                  <button key={amenityKey} type="button" onClick={() => set(!value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${value ? 'bg-brand/10 text-brand border-brand/30' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${value ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                      {value && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </span>
                    {t(amenityKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section: Description */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionDescription')}</p>
          </div>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder={t('descriptionPlaceholder')}
            maxLength={5000}
            height={250}
          />
        </div>

        {/* Section: Photos */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
              <Upload className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionPhotos')}</p>
            <span className="text-xs text-gray-400">{t('optionalTag')}</span>
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover">
              <Upload className="w-4 h-4" />
              {t('choosePhotos')}
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
            </label>
            <p className="text-xs text-gray-500 mt-2">{t('photosHint')}</p>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Contact */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionContact')}</p>
            <span className="text-xs text-red-500 font-semibold">{t('contactRequiredBadge')}</span>
          </div>
          <p className="text-xs text-gray-500 -mt-1">
            {t('contactHint')}
          </p>
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[120px_1fr] gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('codeLabel')}</label>
              <input type="text" value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('phoneLabel')}</label>
              <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder={t('phonePlaceholder')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-2">{t('reachYouHint')}</p>
          <div className="flex flex-wrap gap-3">
            {[
              { channelKey: 'channelSms' as const, value: hasSms, set: setHasSms, color: 'bg-slate-100 text-slate-800 border-slate-300' },
              { channelKey: 'channelWhatsapp' as const, value: hasWhatsapp, set: setHasWhatsapp, color: 'bg-green-100 text-green-700 border-green-300' },
              { channelKey: 'channelViber' as const, value: hasViber, set: setHasViber, color: 'bg-purple-100 text-purple-700 border-purple-300' },
              { channelKey: 'channelTelegram' as const, value: hasTelegram, set: setHasTelegram, color: 'bg-blue-100 text-blue-700 border-blue-300' },
            ].map(({ channelKey, value, set, color }) => (
              <button key={channelKey} onClick={() => set(!value)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${value ? color : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                {t(channelKey)} {value ? '✓' : ''}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('emailLabel')} <span className="font-normal text-gray-400">{t('optionalTag')}</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('emailPlaceholder')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('websiteLabel')} <span className="font-normal text-gray-400">{t('optionalTag')}</span></label>
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder={t('websitePlaceholder')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>
          </div>
        </div>

        {/* Section: Services */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <button onClick={() => setServicesOpen(!servicesOpen)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-sm font-bold text-gray-800">{t('sectionServices')}</p>
              <span className="text-xs text-gray-400">{t('optionalTag')}</span>
              {selectedServices.length > 0 && (
                <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">{t('selectedCount', { count: selectedServices.length })}</span>
              )}
            </div>
            {servicesOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {servicesOpen && (
            <div className="mt-4 space-y-4">
              {Object.entries(servicesByCategory).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{cat.replace(/_/g, ' ')}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(s => (
                      <button key={s.id} onClick={() => toggleService(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selectedServices.includes(s.id) ? 'bg-brand/10 text-brand border-brand/30' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Duration / Purchase */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionDuration')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packages.map(pkg => {
              const sel = selectedPackage?.id === pkg.id
              return (
                <div key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                  className={`relative rounded-lg border-2 p-4 text-center cursor-pointer transition-all ${sel ? 'border-brand bg-brand/5 shadow-sm' : 'border-gray-200 hover:border-brand/50'}`}>
                  <p className="text-base font-bold text-gray-900 mb-0.5">{pkg.name}</p>
                  <p className="text-base font-bold text-gray-900">CHF {Number(pkg.price_chf).toFixed(0)}.-</p>
                  {pkg.description && (
                    <p className="text-xs text-gray-400 mt-1">{pkg.description}</p>
                  )}
                  {sel && (
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {selectedPackage && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">{t('whenToStart')}</p>
              <div className="flex gap-2">
                <button onClick={() => setActivationType('immediately')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activationType === 'immediately' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Zap className="w-4 h-4" /> {t('activationImmediately')}
                </button>
                <button onClick={() => setActivationType('at_date')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activationType === 'at_date' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Calendar className="w-4 h-4" /> {t('activationAtDate')}
                </button>
              </div>
              {activationType === 'at_date' && (
                <input type="datetime-local" value={activationDate} onChange={e => setActivationDate(e.target.value)} className="mt-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
              )}
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="pt-2">
          <TermsAcceptance checked={termsAccepted} onChange={setTermsAccepted} disabled={submitting} />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => router.push(backHref)} className="text-sm font-semibold text-gray-600 hover:text-gray-900">{t('cancel')}</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !location.trim() || !description.trim() || !selectedPackage || !termsAccepted}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Briefcase className="w-4 h-4" />
            {submitting
              ? t('submitRedirecting')
              : selectedPackage
                ? t('submitPay', { amount: Number(selectedPackage.price_chf).toFixed(0) })
                : t('submitContinue')}
          </button>
        </div>

        </>)}

      </div>
    </div>
  )
}
