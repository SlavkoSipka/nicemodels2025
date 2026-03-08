'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { processImage } from '@/lib/imageProcessor'
import CitySearch, { CityResult } from '@/components/ui/CitySearch'
import RichTextEditor from '@/components/ui/RichTextEditor'
import {
  Briefcase, ArrowLeft, MapPin, FileText, Upload, Phone,
  AlertCircle, CheckCircle, Trash2, Zap, Calendar, ChevronDown, ChevronUp
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

export default function CreateJobRentPage() {
  const router = useRouter()
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
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])

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

  // Package
  const [packages, setPackages] = useState<Product[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null)
  const [activationType, setActivationType] = useState<'immediately' | 'at_date'>('immediately')
  const [activationDate, setActivationDate] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Pre-fill contact from club_contact_details
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

      // Load services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, category')
        .order('category')
        .order('name')

      if (servicesData) setAllServices(servicesData)

      // Load packages
      const { data: pkgData } = await supabase
        .from('products')
        .select('*')
        .eq('product_type', 'job_package')
        .eq('is_active', true)
        .order('display_order')

      if (pkgData) {
        // Deduplicate by name, keep the first occurrence of each
        const seen = new Set<string>()
        setPackages(pkgData.filter(p => {
          if (seen.has(p.name)) return false
          seen.add(p.name)
          return true
        }))
      }

      setLoading(false)
    }
    init()
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
    if (!title.trim()) { setError('Title is required'); return }
    if (!location.trim()) { setError('Location is required'); return }
    if (!description.trim()) { setError('Description is required'); return }
    if (!selectedPackage) { setError('Please select a duration package'); return }

    setError('')
    setSubmitting(true)

    try {
      // 1. Create order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({ user_id: user.id, status: 'paid', total_amount: 0, payment_method: 'card' })
        .select()
        .single()

      if (orderErr || !order) throw orderErr || new Error('Failed to create order')

      // 2. Create order item
      const actDate = activationType === 'at_date' && activationDate
        ? new Date(activationDate).toISOString()
        : null

      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: selectedPackage.id,
        price_chf: 0,
        activation_type: activationType,
        activation_date: actDate,
      })

      // 3. Compute dates
      const startsAt = actDate ? new Date(actDate) : new Date()
      const durationMs = (selectedPackage.duration_days * 86400000) + (selectedPackage.duration_hours * 3600000)
      const expiresAt = new Date(startsAt.getTime() + durationMs)

      // 4. Insert job listing
      const { data: listing, error: listingErr } = await supabase
        .from('job_listings')
        .insert({
          club_id: user.id,
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
          status: 'active',
          starts_at: startsAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (listingErr || !listing) throw listingErr || new Error('Failed to create listing')

      // 5. Upload photos
      for (let i = 0; i < photos.length; i++) {
        const raw = photos[i].file
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50cf2ad9-ac74-40dc-906b-756dc9141d3b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c615d'},body:JSON.stringify({sessionId:'6c615d',location:'create/page.tsx:upload-start',message:'Starting photo upload',data:{index:i,fileName:raw.name,fileSize:raw.size,fileType:raw.type,userEmail:user.email},timestamp:Date.now(),hypothesisId:'A,B,C'})}).catch(()=>{});
        // #endregion
        let processed: File
        try {
          processed = await processImage(raw)
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/50cf2ad9-ac74-40dc-906b-756dc9141d3b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c615d'},body:JSON.stringify({sessionId:'6c615d',location:'create/page.tsx:processImage-done',message:'processImage completed',data:{index:i,processedSize:processed.size,processedType:processed.type},timestamp:Date.now(),hypothesisId:'A,D'})}).catch(()=>{});
          // #endregion
        } catch (procErr: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/50cf2ad9-ac74-40dc-906b-756dc9141d3b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c615d'},body:JSON.stringify({sessionId:'6c615d',location:'create/page.tsx:processImage-error',message:'processImage THREW',data:{index:i,error:procErr?.message},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          continue
        }
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`
        const filePath = `${user.id}/${listing.id}/${fileName}`

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50cf2ad9-ac74-40dc-906b-756dc9141d3b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c615d'},body:JSON.stringify({sessionId:'6c615d',location:'create/page.tsx:pre-upload',message:'About to upload to storage',data:{filePath,processedSize:processed.size,processedType:processed.type},timestamp:Date.now(),hypothesisId:'B,C,E'})}).catch(()=>{});
        // #endregion

        const { error: upErr } = await supabase.storage
          .from('job-listing-photos')
          .upload(filePath, processed, { contentType: 'image/webp', cacheControl: '3600', upsert: false })

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/50cf2ad9-ac74-40dc-906b-756dc9141d3b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6c615d'},body:JSON.stringify({sessionId:'6c615d',location:'create/page.tsx:post-upload',message:'Storage upload result',data:{filePath,success:!upErr,error:upErr?{message:upErr.message,name:(upErr as any).name,statusCode:(upErr as any).statusCode}:null},timestamp:Date.now(),hypothesisId:'B,C,E'})}).catch(()=>{});
        // #endregion

        if (upErr) {
          console.error('Photo upload error:', upErr)
          continue
        }

        await supabase.from('job_listing_photos').insert({
          listing_id: listing.id,
          file_path: filePath,
          file_name: raw.name,
          display_order: i,
        })
      }

      // 6. Save services
      if (selectedServices.length > 0) {
        await supabase.from('job_listing_services').insert(
          selectedServices.map(sid => ({ listing_id: listing.id, service_id: sid }))
        )
      }

      setSuccess('Listing created successfully!')
      setTimeout(() => router.push('/dashboard/company/jobs-rent'), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to create listing')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Listing</h1>
            <p className="text-xs text-gray-500">Post a new job or rent listing</p>
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
              Choose Photos
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

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
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

        {/* Section 6: Duration / Purchase */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-gray-800">Duration</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-sm text-emerald-900">
              <span className="font-bold">Beta:</span> All listing packages are currently <span className="font-semibold">free</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packages.map(pkg => {
              const sel = selectedPackage?.id === pkg.id
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative rounded-lg border-2 p-4 text-center cursor-pointer transition-all ${
                    sel
                      ? 'border-brand bg-brand/5 shadow-sm'
                      : 'border-gray-200 hover:border-brand/50'
                  }`}
                >
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-emerald-500 whitespace-nowrap">
                    Beta — Free
                  </div>
                  <p className="text-base font-bold text-gray-900 mb-0.5">{pkg.name}</p>
                  <p className="text-xs text-gray-400">{pkg.description}</p>
                  {sel && (
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {selectedPackage && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2">When to start:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setActivationType('immediately')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activationType === 'immediately'
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Zap className="w-4 h-4" /> Immediately
                </button>
                <button
                  onClick={() => setActivationType('at_date')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activationType === 'at_date'
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calendar className="w-4 h-4" /> At date
                </button>
              </div>
              {activationType === 'at_date' && (
                <input
                  type="datetime-local"
                  value={activationDate}
                  onChange={e => setActivationDate(e.target.value)}
                  className="mt-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              )}
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
            disabled={submitting || !title.trim() || !location.trim() || !description.trim() || !selectedPackage}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Briefcase className="w-4 h-4" />
            {submitting ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>

      </div>
    </div>
  )
}
