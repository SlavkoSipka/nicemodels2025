'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import RichTextEditor from '@/components/ui/RichTextEditor'
import PhoneInput from '@/components/ui/PhoneInput'
import {
  ArrowLeft, Save, AlertCircle, CheckCircle, MapPin, FileText,
  Upload, Phone, Briefcase, Trash2, ChevronDown, ChevronUp,
  Home, DollarSign,
} from 'lucide-react'
import AdminMessageButton from '@/components/admin/AdminMessageButton'

interface ExistingPhoto {
  id: string
  file_path: string
  url: string
}

interface ServiceItem {
  id: string
  name: string
  category: string
}

interface Props {
  listing: any
  photos: ExistingPhoto[]
  selectedServiceIds: string[]
  allServices: ServiceItem[]
  supaUrl: string
}

export default function AdminListingEditClient({
  listing,
  photos: initialPhotos,
  selectedServiceIds: initialServices,
  allServices,
  supaUrl,
}: Props) {
  const router = useRouter()
  const t = useTranslations('admin.listingEdit')
  const tc = useTranslations('admin.common')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form fields
  const [listingType, setListingType] = useState<'job' | 'rent'>(listing.listing_type || 'job')
  const [title, setTitle] = useState(listing.title || '')
  const [location, setLocation] = useState(listing.location || '')
  const [description, setDescription] = useState(listing.description || '')
  const [status, setStatus] = useState(listing.status || 'active')
  const [countryCode, setCountryCode] = useState(listing.country_code || '+41')
  const [phoneNumber, setPhoneNumber] = useState(listing.phone_number || '')
  const [hasWhatsapp, setHasWhatsapp] = useState(listing.has_whatsapp || false)
  const [hasViber, setHasViber] = useState(listing.has_viber || false)
  const [hasTelegram, setHasTelegram] = useState(listing.has_telegram || false)
  const [hasSms, setHasSms] = useState(listing.has_sms || false)
  const [email, setEmail] = useState(listing.email || '')
  const [website, setWebsite] = useState(listing.website || '')

  // Rent-specific fields
  const [rentPriceDaily, setRentPriceDaily] = useState(listing.rent_price_daily != null ? String(listing.rent_price_daily) : '')
  const [rentPriceWeekly, setRentPriceWeekly] = useState(listing.rent_price_weekly != null ? String(listing.rent_price_weekly) : '')
  const [rentPriceMonthly, setRentPriceMonthly] = useState(listing.rent_price_monthly != null ? String(listing.rent_price_monthly) : '')
  const [rentWorkPermit, setRentWorkPermit] = useState(listing.rent_work_permit || false)
  const [rentRoomSize, setRentRoomSize] = useState(listing.rent_room_size || '')
  const [rentFurnished, setRentFurnished] = useState(listing.rent_furnished || false)
  const [rentKitchen, setRentKitchen] = useState(listing.rent_kitchen || false)
  const [rentBathroom, setRentBathroom] = useState(listing.rent_bathroom || false)
  const [rentAirConditioning, setRentAirConditioning] = useState(listing.rent_air_conditioning || false)
  const [rentTowels, setRentTowels] = useState(listing.rent_towels || false)

  // Photos
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(initialPhotos)
  const [newPhotoFiles, setNewPhotoFiles] = useState<{ file: File; preview: string }[]>([])

  // Services
  const [selectedServices, setSelectedServices] = useState<string[]>(initialServices)
  const [servicesOpen, setServicesOpen] = useState(false)

  const servicesByCategory = allServices.reduce<Record<string, ServiceItem[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {})

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const added = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setNewPhotoFiles(prev => [...prev, ...added])
    e.target.value = ''
  }

  const removeExistingPhoto = async (photoId: string) => {
    if (!confirm(t('photoConfirmDelete'))) return
    const res = await fetch('/api/admin/listing-photo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    })
    if (res.ok) {
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId))
    } else {
      const data = await res.json()
      alert(data.error || t('photoDeleteFailed'))
    }
  }

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(newPhotoFiles[index].preview)
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index))
  }

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!title.trim()) { setError(t('titleRequired')); return }
    if (!location.trim()) { setError(t('locationRequired')); return }
    if (!description.trim()) { setError(t('descriptionRequired')); return }

    setError('')
    setSubmitting(true)

    try {
      // 1. Update listing fields
      const updateRes = await fetch('/api/admin/update-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          listing_type: listingType,
          title: title.trim(),
          location: location.trim(),
          description: description.trim(),
          status,
          country_code: countryCode,
          phone_number: phoneNumber.trim() || null,
          has_whatsapp: hasWhatsapp,
          has_viber: hasViber,
          has_telegram: hasTelegram,
          has_sms: hasSms,
          email: email.trim() || null,
          website: website.trim() || null,
          rent_price_daily: listingType === 'rent' && rentPriceDaily ? parseFloat(rentPriceDaily) : null,
          rent_price_weekly: listingType === 'rent' && rentPriceWeekly ? parseFloat(rentPriceWeekly) : null,
          rent_price_monthly: listingType === 'rent' && rentPriceMonthly ? parseFloat(rentPriceMonthly) : null,
          rent_work_permit: listingType === 'rent' ? rentWorkPermit : false,
          rent_room_size: listingType === 'rent' ? (rentRoomSize.trim() || null) : null,
          rent_furnished: listingType === 'rent' ? rentFurnished : false,
          rent_kitchen: listingType === 'rent' ? rentKitchen : false,
          rent_bathroom: listingType === 'rent' ? rentBathroom : false,
          rent_air_conditioning: listingType === 'rent' ? rentAirConditioning : false,
          rent_towels: listingType === 'rent' ? rentTowels : false,
        }),
      })
      if (!updateRes.ok) {
        const d = await updateRes.json()
        throw new Error(d.error || tc('failedToUpdate'))
      }

      // 2. Upload new photos
      for (let i = 0; i < newPhotoFiles.length; i++) {
        const formData = new FormData()
        formData.append('listing_id', listing.id)
        formData.append('photo', newPhotoFiles[i].file)
        formData.append('display_order', String(existingPhotos.length + i))
        const res = await fetch('/api/admin/listing-photo', { method: 'POST', body: formData })
        if (res.ok) {
          const { photo } = await res.json()
          setExistingPhotos(prev => [...prev, {
            id: photo.id,
            file_path: photo.file_path,
            url: `${supaUrl}/storage/v1/object/public/job-listing-photos/${photo.file_path}`,
          }])
        }
      }
      setNewPhotoFiles([])

      // 3. Sync services
      await fetch('/api/admin/listing-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id, serviceIds: selectedServices }),
      })

      setSuccess(t('successMessage'))
      setTimeout(() => router.push('/dashboard/admin/jobs-rents'), 1500)
    } catch (err: any) {
      setError(err.message || tc('failedToUpdate'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-3 sm:py-6 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div>
          <Link href="/dashboard/admin/jobs-rents" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
            <ArrowLeft className="w-3 h-3" /> {t('back')}
          </Link>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{t('title')}</h1>
                <p className="text-xs text-gray-500">{t('subtitle')}</p>
              </div>
            </div>
            {listing.club_id && (
              <AdminMessageButton
                userId={listing.club_id}
                recipientName={listing.title || (listing.listing_type === 'rent' ? t('rentOwner') : t('jobOwner'))}
                defaultSubject={listing.listing_type === 'rent' ? t('messageSubjectRent') : t('messageSubjectJob')}
              />
            )}
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

        {/* Section 1: About */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionAbout')}</p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('type')}</label>
            <div className="flex gap-2">
              {(['job', 'rent'] as const).map(lt => (
                <button key={lt} onClick={() => setListingType(lt)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    listingType === lt ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {lt === 'job' ? t('typeJob') : t('typeRent')}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('status')}</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="active">{t('statusActive')}</option>
              <option value="expired">{t('statusExpired')}</option>
              <option value="deleted">{t('statusDeleted')}</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('fieldTitle')} *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={t('fieldTitlePlaceholder')}
              maxLength={200}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('fieldLocation')} *</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder={t('fieldLocationPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
        </div>

        {/* Section: Rent Details (only when type = rent) */}
        {listingType === 'rent' && (
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                <Home className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm font-bold text-gray-800">{t('sectionRentDetails')}</p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs font-bold text-gray-700">{t('pricing')}</p>
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
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('roomSize')} <span className="font-normal text-gray-400">{tc('optional')}</span></label>
              <input type="text" value={rentRoomSize} onChange={e => setRentRoomSize(e.target.value)} placeholder={t('roomSizePlaceholder')} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">{t('workPermit')}</p>
              <button type="button" onClick={() => setRentWorkPermit(!rentWorkPermit)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${rentWorkPermit ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${rentWorkPermit ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                  {rentWorkPermit && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </span>
                {t('workPermitAllowed')}
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">{t('amenities')}</p>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'furnished', label: t('amenityFurnished'), value: rentFurnished, set: setRentFurnished },
                  { key: 'kitchen', label: t('amenityKitchen'), value: rentKitchen, set: setRentKitchen },
                  { key: 'showerWc', label: t('amenityShowerWc'), value: rentBathroom, set: setRentBathroom },
                  { key: 'airCon', label: t('amenityAirCon'), value: rentAirConditioning, set: setRentAirConditioning },
                  { key: 'towels', label: t('amenityTowels'), value: rentTowels, set: setRentTowels },
                ] as const).map(({ key, label, value, set }) => (
                  <button key={key} type="button" onClick={() => set(!value)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${value ? 'bg-brand/10 text-brand border-brand/30' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${value ? 'bg-brand border-brand' : 'border-gray-300'}`}>
                      {value && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Description */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionDescription')} *</p>
          </div>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder={t('descriptionPlaceholder')}
            maxLength={5000}
            height={250}
          />
        </div>

        {/* Section 3: Photos */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
              <Upload className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionPhotos')}</p>
            <span className="text-xs text-gray-400">{tc('optional')}</span>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700">
              <Upload className="w-4 h-4" />
              {t('addPhotos')}
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
            </label>
            <p className="text-xs text-gray-500 mt-2">{t('photoFormatHint')}</p>
          </div>

          {(existingPhotos.length > 0 || newPhotoFiles.length > 0) && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {existingPhotos.map(p => (
                <div key={p.id} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeExistingPhoto(p.id)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {newPhotoFiles.map((p, i) => (
                <div key={`new-${i}`} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-purple-300">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 text-[9px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">{t('photoNew')}</span>
                  <button
                    onClick={() => removeNewPhoto(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Contact */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('sectionContact')}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t('phoneNumber')}</label>
            <PhoneInput
              countryCode={countryCode}
              phoneNumber={phoneNumber}
              onCountryCodeChange={setCountryCode}
              onPhoneNumberChange={setPhoneNumber}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <p className="text-xs text-gray-500 mb-2">{t('phoneOptions')}</p>
          <div className="flex flex-wrap gap-3">
            {[
              { key: 'sms', label: t('sms'), value: hasSms, set: setHasSms, color: 'bg-slate-100 text-slate-800 border-slate-300' },
              { key: 'whatsapp', label: t('whatsapp'), value: hasWhatsapp, set: setHasWhatsapp, color: 'bg-green-100 text-green-700 border-green-300' },
              { key: 'viber', label: t('viber'), value: hasViber, set: setHasViber, color: 'bg-purple-100 text-purple-700 border-purple-300' },
              { key: 'telegram', label: t('telegram'), value: hasTelegram, set: setHasTelegram, color: 'bg-blue-100 text-blue-700 border-blue-300' },
            ].map(({ key, label, value, set, color }) => (
              <button key={key} onClick={() => set(!value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  value ? color : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}>
                {label} {value ? '✓' : ''}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('email')} <span className="font-normal text-gray-400">{tc('optional')}</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('website')} <span className="font-normal text-gray-400">{tc('optional')}</span></label>
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
                placeholder={t('websitePlaceholder')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>
        </div>

        {/* Section 5: Services */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
          <button onClick={() => setServicesOpen(!servicesOpen)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-sm font-bold text-gray-800">{t('sectionServices')}</p>
              <span className="text-xs text-gray-400">{tc('optional')}</span>
              {selectedServices.length > 0 && (
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {t('selectedCount', { count: selectedServices.length })}
                </span>
              )}
            </div>
            {servicesOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {servicesOpen && (
            <div className="mt-4 space-y-4">
              {Object.entries(servicesByCategory).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    {cat.replace(/_/g, ' ')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(s => (
                      <button key={s.id} onClick={() => toggleService(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedServices.includes(s.id)
                            ? 'bg-purple-50 text-purple-700 border-purple-300'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit (desktop only) */}
        <div className="hidden sm:flex items-center justify-between gap-3 pt-2 pb-8 flex-wrap">
          <Link href="/dashboard/admin/jobs-rents"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            {tc('cancel')}
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !location.trim() || !description.trim()}
            className="flex items-center gap-1.5 px-4 sm:px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? tc('saving') : t('saveChanges')}
          </button>
        </div>

        <div className="sm:hidden h-16" />

      </div>

      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Link href="/dashboard/admin/jobs-rents" className="flex-1 text-center px-3 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">{tc('cancel')}</Link>
        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim() || !location.trim() || !description.trim()}
          className="flex-[2] flex items-center justify-center gap-1.5 px-3 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
          <Save className="w-4 h-4" />
          {submitting ? tc('saving') : t('saveChanges')}
        </button>
      </div>
    </div>
  )
}
