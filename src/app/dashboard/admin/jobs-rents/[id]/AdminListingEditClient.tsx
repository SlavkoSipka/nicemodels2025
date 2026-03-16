'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RichTextEditor from '@/components/ui/RichTextEditor'
import {
  ArrowLeft, Save, AlertCircle, CheckCircle, MapPin, FileText,
  Upload, Phone, Briefcase, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react'

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
  const [email, setEmail] = useState(listing.email || '')
  const [website, setWebsite] = useState(listing.website || '')

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
    if (!confirm('Delete this photo?')) return
    const res = await fetch('/api/admin/listing-photo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    })
    if (res.ok) {
      setExistingPhotos(prev => prev.filter(p => p.id !== photoId))
    } else {
      const data = await res.json()
      alert(data.error || 'Failed to delete photo')
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
    if (!title.trim()) { setError('Title is required'); return }
    if (!location.trim()) { setError('Location is required'); return }
    if (!description.trim()) { setError('Description is required'); return }

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
          email: email.trim() || null,
          website: website.trim() || null,
        }),
      })
      if (!updateRes.ok) {
        const d = await updateRes.json()
        throw new Error(d.error || 'Failed to update listing')
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

      setSuccess('Listing updated successfully!')
      setTimeout(() => router.push('/dashboard/admin/jobs-rents'), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update listing')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div>
          <Link href="/dashboard/admin/jobs-rents" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
            <ArrowLeft className="w-3 h-3" /> Back to Jobs & Rents
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Listing</h1>
              <p className="text-xs text-gray-500">Admin — full listing edit</p>
            </div>
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
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">About</p>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Type</label>
            <div className="flex gap-2">
              {(['job', 'rent'] as const).map(t => (
                <button key={t} onClick={() => setListingType(t)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    listingType === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}>
                  {t === 'job' ? 'Job' : 'Rent'}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Looking for experienced dancers..."
              maxLength={200}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Location *</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="City or location..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
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
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700">
              <Upload className="w-4 h-4" />
              Add Photos
              <input type="file" accept="image/*" multiple onChange={handlePhotoSelect} className="hidden" />
            </label>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG or WEBP — Max 10MB per file</p>
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
                  <span className="absolute top-1 left-1 text-[9px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">NEW</span>
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
              <input type="text" value={countryCode} onChange={e => setCountryCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
              <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { label: 'WhatsApp', value: hasWhatsapp, set: setHasWhatsapp, color: 'bg-green-100 text-green-700 border-green-300' },
              { label: 'Viber', value: hasViber, set: setHasViber, color: 'bg-purple-100 text-purple-700 border-purple-300' },
              { label: 'Telegram', value: hasTelegram, set: setHasTelegram, color: 'bg-blue-100 text-blue-700 border-blue-300' },
            ].map(({ label, value, set, color }) => (
              <button key={label} onClick={() => set(!value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  value ? color : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}>
                {label} {value ? '✓' : ''}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email <span className="font-normal text-gray-400">(optional)</span></label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Website <span className="font-normal text-gray-400">(optional)</span></label>
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>
        </div>

        {/* Section 5: Services */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <button onClick={() => setServicesOpen(!servicesOpen)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-sm font-bold text-gray-800">Services</p>
              <span className="text-xs text-gray-400">(optional)</span>
              {selectedServices.length > 0 && (
                <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
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

        {/* Submit */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link href="/dashboard/admin/jobs-rents"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !location.trim() || !description.trim()}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}
