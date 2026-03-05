'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { processImage } from '@/lib/imageProcessor'

interface ClubFormData {
  // Step 1: Basic Info
  club_name: string
  display_name: string
  area: string
  about_description: string
  is_club: boolean
  entrance_fee: string
  wellness: string
  food_and_drinks: string
  outdoor_area: string
  
  // Step 2: Contact Details
  country_code?: string
  phone_number?: string
  has_viber?: boolean
  has_whatsapp?: boolean
  has_telegram?: boolean
  contact_instruction?: string
  no_withheld_numbers?: boolean
  other_instructions?: string
  email?: string
  website?: string
  street?: string
  street_number?: string
  additional_info?: string
  city?: string
  zip_code?: string
  hide_contact_info?: boolean
}

type ScheduleType = 'custom' | 'same_every_day' | '24_7'

interface DayHours {
  from: string
  to: string
}

const ENTRANCE_FEE_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'free', label: 'Free' },
  { value: 'with_cost', label: 'With cost' }
]

const WELLNESS_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

const FOOD_DRINKS_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

const OUTDOOR_AREA_OPTIONS = [
  { value: 'na', label: 'N/A' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' }
]

export default function ClubOnboardingForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 1
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cities, setCities] = useState<any[]>([])

  const [formData, setFormData] = useState<ClubFormData>({
    club_name: '',
    display_name: '',
    area: '',
    about_description: '',
    is_club: false,
    entrance_fee: 'na',
    wellness: 'na',
    food_and_drinks: 'na',
    outdoor_area: 'na',
    
    // Step 2 defaults
    country_code: '+41',
    phone_number: '',
    has_viber: false,
    has_whatsapp: false,
    has_telegram: false,
    contact_instruction: 'sms_and_call',
    no_withheld_numbers: false,
    other_instructions: '',
    email: '',
    website: '',
    street: '',
    street_number: '',
    additional_info: '',
    city: '',
    zip_code: '',
    hide_contact_info: false
  })

  // Working Hours state (Step 3)
  const [scheduleType, setScheduleType] = useState<ScheduleType>('24_7')
  const [sameEveryDayHours, setSameEveryDayHours] = useState<DayHours>({ from: '', to: '' })
  const [customHours, setCustomHours] = useState<Record<string, DayHours>>({
    monday: { from: '', to: '' },
    tuesday: { from: '', to: '' },
    wednesday: { from: '', to: '' },
    thursday: { from: '', to: '' },
    friday: { from: '', to: '' },
    saturday: { from: '', to: '' },
    sunday: { from: '', to: '' },
  })

  // Step 4: Photos and Videos
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; file_name: string; file_path: string }>>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadedVideos, setUploadedVideos] = useState<Array<{ id: string; file_name: string; file_path: string }>>([])
  const [uploadingVideos, setUploadingVideos] = useState(false)

  // Character count for description
  const [charCount, setCharCount] = useState(0)
  const maxChars = 3000

  // Load cities from database
  useEffect(() => {
    const loadCities = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, canton')
        .eq('is_active', true)
        .order('display_order')
      
      if (data) {
        setCities(data)
      }
    }
    
    loadCities()
  }, [])

  const handleChange = (field: keyof ClubFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'about_description') {
      setCharCount(value.length)
    }
  }

  const handleCustomHoursChange = (day: string, field: 'from' | 'to', value: string) => {
    setCustomHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const files = Array.from(e.target.files)
    setUploadingPhotos(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      for (const rawFile of files) {
        // Validate file size (max 10MB)
        if (rawFile.size > 10 * 1024 * 1024) {
          alert(`${rawFile.name} is too large. Max size is 10MB.`)
          continue
        }

        // Compress + watermark
        const file = await processImage(rawFile)
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`
        const filePath = `${user.email}/photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('club-photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create metadata record
        const { data: photoData, error: dbError } = await supabase
          .from('club_photos')
          .insert({
            club_id: user.id,
            file_path: filePath,
            file_name: file.name,
            is_approved: true
          })
          .select()
          .single()

        if (dbError) throw dbError

        // Add to uploaded photos
        setUploadedPhotos(prev => [...prev, { 
          id: photoData.id, 
          file_name: file.name, 
          file_path: filePath
        }])
      }
    } catch (err: any) {
      console.error('Error uploading photos:', err)
      alert('Failed to upload photos. Please try again.')
    } finally {
      setUploadingPhotos(false)
      // Reset input
      e.target.value = ''
    }
  }

  const deletePhoto = async (photoId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    
    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('club-photos')
        .remove([filePath])
      
      if (storageError) throw storageError
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('club_photos')
        .delete()
        .eq('id', photoId)
      
      if (dbError) throw dbError
      
      // Remove from state
      setUploadedPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch (err: any) {
      console.error('Error deleting photo:', err)
      alert('Failed to delete photo. Please try again.')
    }
  }

  // Video upload handler
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const files = Array.from(e.target.files)
    setUploadingVideos(true)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      for (const file of files) {
        // Validate file size (max 200MB)
        if (file.size > 200 * 1024 * 1024) {
          alert(`${file.name} is too large. Max size is 200MB.`)
          continue
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/x-msvideo', 'video/x-matroska']
        if (!allowedTypes.includes(file.type)) {
          alert(`${file.name} is not a valid video format. Allowed: MP4, MOV, WMV, FLV, AVI, MKV.`)
          continue
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.email}/videos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('club-videos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create metadata record
        const { data: videoData, error: dbError } = await supabase
          .from('club_videos')
          .insert({
            club_id: user.id,
            file_path: filePath,
            file_name: file.name,
          })
          .select()
          .single()

        if (dbError) throw dbError

        // Add to uploaded videos
        setUploadedVideos(prev => [...prev, { 
          id: videoData.id, 
          file_name: file.name, 
          file_path: filePath 
        }])
      }
    } catch (err: any) {
      console.error('Error uploading videos:', err)
      alert('Failed to upload videos. Please try again.')
    } finally {
      setUploadingVideos(false)
      // Reset input
      e.target.value = ''
    }
  }

  const deleteVideo = async (videoId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('club-videos')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('club_videos')
        .delete()
        .eq('id', videoId)

      if (dbError) throw dbError

      // Remove from state
      setUploadedVideos(prev => prev.filter(v => v.id !== videoId))
    } catch (err: any) {
      console.error('Error deleting video:', err)
      alert('Failed to delete video.')
    }
  }

  // Text formatting functions
  const formatText = (command: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    let formattedText = ''
    
    switch (command) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'underline':
        formattedText = `__${selectedText}__`
        break
    }

    const newText = 
      textarea.value.substring(0, start) + 
      formattedText + 
      textarea.value.substring(end)
    
    handleChange('about_description', newText)
    
    // Set cursor position after formatted text
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.club_name) {
      setError('Club Name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error: insertError } = await supabase
        .from('club_details')
        .insert({
          club_id: user.id,
          club_name: formData.club_name,
          display_name: formData.display_name,
          area: formData.area,
          about_description: formData.about_description,
          is_club: formData.is_club,
          entrance_fee: formData.entrance_fee,
          wellness: formData.wellness,
          food_and_drinks: formData.food_and_drinks,
          outdoor_area: formData.outdoor_area,
        })

      if (insertError) throw insertError

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      router.push('/dashboard/company')
      router.refresh()
    } catch (err: any) {
      console.error('Submission error:', err)
      setError(err.message || 'An error occurred during submission')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const progress = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="w-full">
      {/* Step indicator and progress bar (aligned with model onboarding style) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-pink-600">
              Club / Agency onboarding
            </p>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              Basic Info
            </h2>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
            <div className="mt-1 w-32 bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg mb-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Info Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Info</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Club Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Club Name <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.club_name}
                    onChange={(e) => handleChange('club_name', e.target.value)}
                    placeholder="Enter club name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                    required
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => handleChange('display_name', e.target.value)}
                    placeholder="Enter display name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <div className="relative">
                    <select
                      value={formData.area}
                      onChange={(e) => handleChange('area', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 appearance-none cursor-pointer"
                    >
                      <option value="">Select area</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.name}>
                          {city.name}{city.canton ? ` (${city.canton})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
              
              <div className="border border-gray-300 rounded-lg bg-gray-50">
                <textarea
                  ref={textareaRef}
                  value={formData.about_description}
                  onChange={(e) => handleChange('about_description', e.target.value)}
                  placeholder="Describe your club / agency, atmosphere, concept…"
                  maxLength={maxChars}
                  rows={4}
                  className="w-full px-3 py-2 text-sm focus:outline-none resize-none bg-gray-50"
                />
              </div>
              <div className="mt-1 text-right text-xs text-gray-500">
                {charCount} / {maxChars}
              </div>

              {/* Is Club Checkbox */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_club"
                  checked={formData.is_club}
                  onChange={(e) => handleChange('is_club', e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 cursor-pointer"
                />
                <label htmlFor="is_club" className="text-sm text-gray-700 cursor-pointer">
                  Is Club
                </label>
              </div>
            </div>

            {/* Entrance Fee, Wellness, Food and drinks, Outdoor area - Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              {/* Entrance Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entrance fee
                </label>
                <div className="relative">
                  <select
                    value={formData.entrance_fee}
                    onChange={(e) => handleChange('entrance_fee', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 appearance-none cursor-pointer"
                  >
                    {ENTRANCE_FEE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Wellness */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wellness
                </label>
                <div className="relative">
                  <select
                    value={formData.wellness}
                    onChange={(e) => handleChange('wellness', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 appearance-none cursor-pointer"
                  >
                    {WELLNESS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Food and Drinks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food and drinks
                </label>
                <div className="relative">
                  <select
                    value={formData.food_and_drinks}
                    onChange={(e) => handleChange('food_and_drinks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 appearance-none cursor-pointer"
                  >
                    {FOOD_DRINKS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Outdoor Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Outdoor area
                </label>
                <div className="relative">
                  <select
                    value={formData.outdoor_area}
                    onChange={(e) => handleChange('outdoor_area', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 appearance-none cursor-pointer"
                  >
                    {OUTDOOR_AREA_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Contact Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Phone Number <span className="text-pink-600">*</span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                {/* Country Code */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Country Code</label>
                  <div className="relative">
                    <select
                      value={formData.country_code || '+41'}
                      onChange={(e) => handleChange('country_code', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 appearance-none cursor-pointer"
                    >
                      <option value="+41">Switzerland (+41)</option>
                      <option value="+43">Austria (+43)</option>
                      <option value="+49">Germany (+49)</option>
                      <option value="+33">France (+33)</option>
                      <option value="+39">Italy (+39)</option>
                      <option value="+44">UK (+44)</option>
                      <option value="+1">USA/Canada (+1)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Phone Number <span className="text-pink-600">*</span></label>
                  <input
                    type="tel"
                    value={formData.phone_number || ''}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    placeholder="Phone Number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                Please provide the country calling code if you use a non-Swiss number
              </p>
            </div>

            {/* Messaging Apps */}
            <div className="flex gap-3">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.has_viber || false}
                  onChange={(e) => handleChange('has_viber', e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm">Viber</span>
              </label>

              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.has_whatsapp || false}
                  onChange={(e) => handleChange('has_whatsapp', e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm">WhatsApp</span>
              </label>

              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.has_telegram || false}
                  onChange={(e) => handleChange('has_telegram', e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm">Telegram</span>
              </label>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Instructions</label>
              
              <div className="flex gap-3 mb-3">
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="contact_instruction"
                    value="sms_and_call"
                    checked={formData.contact_instruction === 'sms_and_call'}
                    onChange={(e) => handleChange('contact_instruction', e.target.value)}
                    className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                  />
                  <span className="text-sm">SMS and Call</span>
                </label>

                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="contact_instruction"
                    value="sms_only"
                    checked={formData.contact_instruction === 'sms_only'}
                    onChange={(e) => handleChange('contact_instruction', e.target.value)}
                    className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                  />
                  <span className="text-sm">SMS Only</span>
                </label>

                <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="contact_instruction"
                    value="no_sms"
                    checked={formData.contact_instruction === 'no_sms'}
                    onChange={(e) => handleChange('contact_instruction', e.target.value)}
                    className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                  />
                  <span className="text-sm">No SMS</span>
                </label>
              </div>

              {/* No Withheld Numbers */}
              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={formData.no_withheld_numbers || false}
                  onChange={(e) => handleChange('no_withheld_numbers', e.target.checked)}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <span className="text-sm">No Withheld Numbers</span>
              </label>

              {/* Other Instructions */}
              <textarea
                value={formData.other_instructions || ''}
                onChange={(e) => handleChange('other_instructions', e.target.value)}
                placeholder="Other"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 resize-none"
              />
            </div>

            {/* Web */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Web</label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="E-mail address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                />

                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="Website"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                />
              </div>
            </div>

            {/* Address Details */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Address Details</label>
              
              {/* Street and Number */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-2">
                <div className="md:col-span-3">
                  <input
                    type="text"
                    value={formData.street || ''}
                    onChange={(e) => handleChange('street', e.target.value)}
                    placeholder="Street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">Please use this field for the street name only!</p>
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.street_number || ''}
                    onChange={(e) => handleChange('street_number', e.target.value)}
                    placeholder="Nr."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="mb-3">
                <input
                  type="text"
                  value={formData.additional_info || ''}
                  onChange={(e) => handleChange('additional_info', e.target.value)}
                  placeholder="Additional info"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  e.g. "private and discrete" / "only with appointment" / "second floor" etc.
                </p>
              </div>

              {/* City and ZIP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">City <span className="text-pink-600">*</span></label>
                  <div className="relative">
                    <select
                      value={formData.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50 appearance-none cursor-pointer"
                    >
                      <option value="">Select city</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.name}>
                          {city.name}{city.canton ? ` (${city.canton})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">ZIP</label>
                  <input
                    type="text"
                    value={formData.zip_code || ''}
                    onChange={(e) => handleChange('zip_code', e.target.value)}
                    placeholder="ZIP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Don't show contact info */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.hide_contact_info || false}
                onChange={(e) => handleChange('hide_contact_info', e.target.checked)}
                className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
              />
              <span className="text-sm">Don't show contact info</span>
            </label>
          </div>
        )}

        {/* STEP 3: Working Hours */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Working Hours</h2>
            
            {/* Schedule Type Selection */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setScheduleType('custom')}
                className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                  scheduleType === 'custom'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Schedule
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('same_every_day')}
                className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                  scheduleType === 'same_every_day'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                The same schedule every day
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('24_7')}
                className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                  scheduleType === '24_7'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                I am available 24/7
              </button>
            </div>

            {/* Custom Schedule */}
            {scheduleType === 'custom' && (
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                  const dayKey = day.toLowerCase()
                  return (
                    <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <label className="text-sm font-bold text-gray-700">
                        {day}
                      </label>
                      <div>
                        <input
                          type="time"
                          value={customHours[dayKey]?.from || ''}
                          onChange={(e) => handleCustomHoursChange(dayKey, 'from', e.target.value)}
                          placeholder="From"
                          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                        />
                      </div>
                      <div>
                        <input
                          type="time"
                          value={customHours[dayKey]?.to || ''}
                          onChange={(e) => handleCustomHoursChange(dayKey, 'to', e.target.value)}
                          placeholder="To"
                          className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Same Every Day */}
            {scheduleType === 'same_every_day' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    From
                  </label>
                  <input
                    type="time"
                    value={sameEveryDayHours.from}
                    onChange={(e) => setSameEveryDayHours({ ...sameEveryDayHours, from: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    To
                  </label>
                  <input
                    type="time"
                    value={sameEveryDayHours.to}
                    onChange={(e) => setSameEveryDayHours({ ...sameEveryDayHours, to: e.target.value })}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-gray-50"
                  />
                </div>
              </div>
            )}

            {/* 24/7 Info */}
            {scheduleType === '24_7' && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-sm text-green-800 font-semibold">
                  ✓ You will be shown as available 24/7
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Club Photos */}
        {currentStep === 4 && (
          <div className="space-y-6">
            {/* Photo Section */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  Upload high-quality photos of your club to attract more visitors.
                </p>
                <h4 className="text-sm font-bold text-gray-900 mb-1">Requirements</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Good quality photos.</li>
                  <li>Photo without sexually explicit content.</li>
                  <li>400 x 600 px for portrait images.</li>
                  <li>500 x 375 px for landscape images.</li>
                </ul>
              </div>

              <div>
                <label htmlFor="photo-upload" className="block">
                  <div className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg text-center cursor-pointer inline-block">
                    {uploadingPhotos ? 'UPLOADING...' : 'UPLOAD PHOTO'}
                  </div>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhotos}
                  className="hidden"
                />
              </div>

              {/* Uploaded Photos */}
              {uploadedPhotos.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Your gallery is empty</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative bg-gray-100 rounded-lg p-3 border-2 border-gray-200">
                      <p className="text-xs font-semibold text-gray-900 truncate mb-2">{photo.file_name}</p>
                      <button
                        type="button"
                        onClick={() => deletePhoto(photo.id, photo.file_path)}
                        className="w-full px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Note:</span> All uploaded photos will be reviewed 
                by our admin team before being published on your profile. You will be notified once they are approved.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Previous
            </button>
          )}
          
          <button
            type="submit"
            disabled={
              loading || 
              (currentStep === 1 && !formData.club_name) ||
              (currentStep === 2 && !formData.phone_number)
            }
            className="ml-auto px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'FINISH'}
          </button>
        </div>
      </form>
    </div>
  )
}

