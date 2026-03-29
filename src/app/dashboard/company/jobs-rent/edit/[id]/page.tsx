'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { processImage } from '@/lib/imageProcessor'
import CitySearch, { CityResult } from '@/components/ui/CitySearch'
import RichTextEditor from '@/components/ui/RichTextEditor'
import {
  Briefcase, ArrowLeft, MapPin, FileText, Upload, Phone,
  AlertCircle, CheckCircle, Trash2, ChevronDown, ChevronUp, Save
} from 'lucide-react'

interface ServiceItem {
  id: string
  name: string
  category: string
}

interface ExistingPhoto {
  id: string
  file_path: string
  url: string
}

interface NewPhoto {
  file: File
  preview: string
}

export default function EditJobRentPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [listingType, setListingType] = useState<'job' | 'rent'>('job')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [locationPostalCode, setLocationPostalCode] = useState('')
  const [description, setDescription] = useState('')

  // Photos
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([])
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([])
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([])

  // Contact
  const [countryCode, setCountryCode] = useState('+41')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [hasWhatsapp, setHasWhatsapp] = useState(false)
  const [hasViber, setHasViber] = useState(false)
  const [hasTelegram, setHasTelegram] = useState(false)
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')

  // Services
  const [allServices, setAllServices] = useState<ServiceItem[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [servicesOpen, setServicesOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Load existing listing
      const { data: listing, error: listingErr } = await supabase
        .from('job_listings')
        .select('*')
        .eq('id', listingId)
        .eq('club_id', user.id)
        .single()

      if (listingErr || !listing) {
        setError('Listing not found or you do not have permission to edit it.')
        setLoading(false)
        return
      }

      setListingType(listing.listing_type)
      setTitle(listing.title || '')
      setLocation(listing.location || '')
      setDescription(listing.description || '')
      setCountryCode(listing.country_code || '+41')
      setPhoneNumber(listing.phone_number || '')
      setHasWhatsapp(listing.has_whatsapp || false)
      setHasViber(listing.has_viber || false)
      setHasTelegram(listing.has_telegram || false)
      setEmail(listing.email || '')
      setWebsite(listing.website || '')

      // Load existing photos
      const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
      const { data: photos } = await supabase
        .from('job_listing_photos')
        .select('id, file_path')
        .eq('listing_id', listingId)
        .order('display_order')

      if (photos) {
        setExistingPhotos(photos.map(p => ({
          id: p.id,
          file_path: p.file_path,
          url: `${SUPA_URL}/storage/v1/object/public/job-listing-photos/${p.file_path}`,
        })))
      }

      // Load existing services for this listing
      const { data: listingServices } = await supabase
        .from('job_listing_services')
        .select('service_id')
        .eq('listing_id', listingId)

      if (listingServices) {
        setSelectedServices(listingServices.map(s => s.service_id))
      }

      // Load all available services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, category')
        .order('category')
        .order('name')

      if (servicesData) setAllServices(servicesData)

      setLoading(false)
    }
    init()
  }, [])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const added = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setNewPhotos(prev => [...prev, ...added])
    e.target.value = ''
  }

  const removeExistingPhoto = (id: string) => {
    setDeletedPhotoIds(prev => [...prev, id])
    setExistingPhotos(prev => prev.filter(p => p.id !== id))
  }

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(newPhotos[index].preview)
    setNewPhotos(prev => prev.filter((_, i) => i !== index))
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
    if (!title.trim()) { setError('Title is required'); return }
    if (!location.trim()) { setError('Location is required'); return }
    if (!description.trim()) { setError('Description is required'); return }

    setError('')
    setSubmitting(true)

    try {
      // 1. Update the listing
      const { error: updateErr } = await supabase
        .from('job_listings')
        .update({
          listing_type: listingType,
          title: title.trim(),
          location: location.trim(),
          description: description.trim(),
          country_code: countryCode,
          phone_number: phoneNumber.trim() || null,
          has_whatsapp: hasWhatsapp,
          has_viber: hasViber,
          has_telegram: hasTelegram,
          email: email.trim() || null,
          website: website.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listingId)
        .eq('club_id', user.id)

      if (updateErr) throw updateErr

      // 2. Delete removed photos from storage + DB
      for (const photoId of deletedPhotoIds) {
        const photo = existingPhotos.find(p => p.id === photoId) ||
          (await supabase.from('job_listing_photos').select('file_path').eq('id', photoId).single()).data
        if (photo?.file_path) {
          await supabase.storage.from('job-listing-photos').remove([photo.file_path])
        }
        await supabase.from('job_listing_photos').delete().eq('id', photoId)
      }

      // 3. Upload new photos
      const currentCount = existingPhotos.length
      for (let i = 0; i < newPhotos.length; i++) {
        const raw = newPhotos[i].file
        let processed: File
        try {
          processed = await processImage(raw)
        } catch {
          continue
        }
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`
        const filePath = `${user.id}/${listingId}/${fileName}`

        const { error: upErr } = await supabase.storage
          .from('job-listing-photos')
          .upload(filePath, processed, { contentType: 'image/webp', cacheControl: '3600', upsert: false })

        if (upErr) {
          console.error('Photo upload error:', upErr)
          continue
        }

        await supabase.from('job_listing_photos').insert({
          listing_id: listingId,
          file_path: filePath,
          file_name: raw.name,
          display_order: currentCount + i,
        })
      }

      // 4. Sync services: delete all then re-insert
      await supabase.from('job_listing_services').delete().eq('listing_id', listingId)
      if (selectedServices.length > 0) {
        await supabase.from('job_listing_services').insert(
          selectedServices.map(sid => ({ listing_id: listingId, service_id: sid }))
        )
      }

      setSuccess('Listing updated successfully!')
      setTimeout(() => router.push('/dashboard/company/jobs-rent'), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update listing')
    } finally {
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
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Edit Listing</h1>
            <p className="text-xs text-gray-500">Update your job or rent listing</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/company/jobs-rent')}
            className="ml-auto flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back
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

        {/* Section 1: About */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">About</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
            <div className="flex gap-2">
              {(['job', 'rent'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setListingType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    listingType === t
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t === 'job' ? 'Job' : 'Rent'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Looking for experienced dancers, Studio for rent in Zurich..."
              maxLength={200}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Location *</label>
            <CitySearch
              value={location}
              postalCode={locationPostalCode}
              onChange={(city: CityResult | null) => {
                setLocation(city?.name || '')
                setLocationPostalCode(city?.postal_code || '')
              }}
              placeholder="Search city or postal code..."
              inputClassName="border-gray-200 focus:ring-brand"
            />
          </div>
        </div>

        {/* Section 2: Description */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">Description *</p>
          </div>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Describe the job position or rental property in detail..."
            maxLength={5000}
            height={250}
          />
        </div>

        {/* Section 3: Photos */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
              <Upload className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">Photos</p>
            <span className="text-xs text-gray-400">(optional)</span>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 transition-colors">
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover">
              <Upload className="w-4 h-4" />
              Add Photos
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or WEBP - Max 10MB per file</p>
          </div>

          {(existingPhotos.length > 0 || newPhotos.length > 0) && (
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
              {newPhotos.map((p, i) => (
                <div key={`new-${i}`} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-brand/30">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 text-[9px] font-bold bg-brand text-white px-1.5 py-0.5 rounded">NEW</span>
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
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">Contact</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Code</label>
              <input
                type="text"
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: 'WhatsApp', value: hasWhatsapp, set: setHasWhatsapp, color: 'bg-green-100 text-green-700 border-green-300' },
              { label: 'Viber', value: hasViber, set: setHasViber, color: 'bg-purple-100 text-purple-700 border-purple-300' },
              { label: 'Telegram', value: hasTelegram, set: setHasTelegram, color: 'bg-blue-100 text-blue-700 border-blue-300' },
            ].map(({ label, value, set, color }) => (
              <button
                key={label}
                onClick={() => set(!value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  value ? color : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {label} {value ? '✓' : ''}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Website <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Services */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <button
            onClick={() => setServicesOpen(!servicesOpen)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-sm font-bold text-gray-800">Services</p>
              <span className="text-xs text-gray-400">(optional)</span>
              {selectedServices.length > 0 && (
                <span className="text-xs font-semibold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                  {selectedServices.length} selected
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
                      <button
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedServices.includes(s.id)
                            ? 'bg-brand/10 text-brand border-brand/30'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => router.push('/dashboard/company/jobs-rent')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !location.trim() || !description.trim()}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
