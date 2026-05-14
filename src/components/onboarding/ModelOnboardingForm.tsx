'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { processImage } from '@/lib/imageProcessor'
import CitySearch, { type CityResult } from '@/components/ui/CitySearch'
import RichTextEditor from '@/components/ui/RichTextEditor'

// Countries list (abbreviated)
const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 
  'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 
  'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 
  'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 
  'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 
  'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 
  'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 
  'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 
  'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'Norway', 'Oman', 'Pakistan', 'Palau', 
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 
  'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 
  'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 
  'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

// Popular languages
const LANGUAGES = [
  'English', 'German', 'French', 'Italian', 'Spanish', 'Portuguese', 'Russian', 'Arabic', 
  'Chinese', 'Japanese', 'Korean', 'Turkish', 'Polish', 'Dutch', 'Swedish', 'Norwegian', 
  'Danish', 'Finnish', 'Czech', 'Romanian', 'Greek', 'Hungarian', 'Croatian', 'Serbian', 
  'Bulgarian', 'Ukrainian', 'Albanian', 'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Other'
]

const INCALL_OPTIONS = [
  { value: 'Private apartment', key: 'incall.privateApt' as const },
  { value: 'Hotel room', key: 'incall.hotel' as const },
  { value: 'Club/Studio', key: 'incall.club' as const },
  { value: 'Other', key: 'incall.other' as const },
]

const OUTCALL_OPTIONS = [
  { value: 'Hotel visits only', key: 'outcall.hotelOnly' as const },
  { value: 'Home visits only', key: 'outcall.homeOnly' as const },
  { value: 'Hotel and Home visits', key: 'outcall.hotelHome' as const },
  { value: 'Other', key: 'outcall.other' as const },
]

const WEEKDAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

interface Language {
  language: string
  level: string
}

// Component for adding new language
function NewLanguageInput({ 
  languages, 
  onAdd, 
  availableLanguages 
}: { 
  languages: Language[]
  onAdd: (language: string, level: string) => void
  availableLanguages: string[]
}) {
  const t = useTranslations('onboarding.model')
  const labelFor = (name: string) =>
    t(`langName.${name.toLowerCase().replace(/ /g, '_')}` as Parameters<typeof t>[0])
  const [newLang, setNewLang] = useState('')

  const handleLevelSelect = (level: string) => {
    if (newLang) {
      onAdd(newLang, level)
      setNewLang('') // Reset for next language
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">
          {t('lang.addAnother')}
        </label>
        <select
          value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
        >
          <option value="">{t('selectLanguage')}</option>
          {availableLanguages
            .filter(lang => !languages.find(l => l.language === lang))
            .map(lang => (
              <option key={lang} value={lang}>{labelFor(lang)}</option>
            ))}
        </select>
      </div>

      {newLang && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            {t('lang.level')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'basic', label: t('lang.levelBasic') },
              { value: 'fair', label: t('lang.levelFair') },
              { value: 'good', label: t('lang.levelGood') },
              { value: 'excellent_native', label: t('lang.levelExcellent') },
            ].map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => handleLevelSelect(level.value)}
                className="py-2 px-2 text-xs font-semibold rounded-lg transition-all bg-white text-gray-700 hover:bg-pink-100 border-2 border-gray-200 hover:border-pink-500"
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ModelOnboardingForm() {
  const router = useRouter()
  const { refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  
  const [formData, setFormData] = useState({
    // Basic BIO (Step 1)
    showname: '',
    slogan: '',
    gender: '',
    ethnicity: '',
    nationality: '',
    age: '',
    
    // Physical Features (Step 2)
    hair_color: '',
    eye_color: '',
    height_cm: '',
    weight_kg: '',
    dress_size: '',
    bust_cm: '',
    waist_cm: '',
    hip_cm: '',
    pubic_hair: '',
    
    // Additional Information (Step 3)
    smoking: '',
    drinking: '',
    special_characteristics: '',
    
    // About Me (Step 4)
    about_me: '',
    
    // Area/Location (Step 6)
    city: '',
    incall_options: [] as string[],
    outcall_options: [] as string[],
    
    // Services (Step 7)
    sexual_orientation: '',
    services_for: [] as string[],
  })

  // Languages (Step 5) - Max 5 languages
  const [languages, setLanguages] = useState<Language[]>([])
  const [showAdvancedLanguages, setShowAdvancedLanguages] = useState(false)
  const [primaryLanguage, setPrimaryLanguage] = useState('') // First language without level
  
  // Services (Step 7)
  const [services, setServices] = useState<any[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  
  // Cities (Step 6) - handled by CitySearch component
  
  // Working Hours (Step 8)
  const [scheduleType, setScheduleType] = useState<'custom' | 'same_every_day' | '24_7'>('24_7')
  const [sameEveryDayHours, setSameEveryDayHours] = useState({ from: '', to: '' })
  const [customHours, setCustomHours] = useState({
    monday: { from: '', to: '' },
    tuesday: { from: '', to: '' },
    wednesday: { from: '', to: '' },
    thursday: { from: '', to: '' },
    friday: { from: '', to: '' },
    saturday: { from: '', to: '' },
    sunday: { from: '', to: '' },
  })

  // Rates (Step 9)
  const [incallRates, setIncallRates] = useState<Array<{ duration: string; amount: string; customTime?: string; customUnit?: string }>>([])
  const [outcallRates, setOutcallRates] = useState<Array<{ duration: string; amount: string; customTime?: string; customUnit?: string }>>([])
  const [incallDuration, setIncallDuration] = useState('30_minutes')
  const [incallAmount, setIncallAmount] = useState('')
  const [incallCustomTime, setIncallCustomTime] = useState('')
  const [incallCustomUnit, setIncallCustomUnit] = useState('hours')
  const [outcallDuration, setOutcallDuration] = useState('1_hour')
  const [outcallAmount, setOutcallAmount] = useState('')
  const [outcallCustomTime, setOutcallCustomTime] = useState('')
  const [outcallCustomUnit, setOutcallCustomUnit] = useState('hours')

  // Contact Details (Step 10)
  const [showPhoneNumber, setShowPhoneNumber] = useState(false)
  const [countryCode, setCountryCode] = useState('+41') // Switzerland default
  const [phoneNumber, setPhoneNumber] = useState('')
  const [hasViber, setHasViber] = useState(false)
  const [hasWhatsApp, setHasWhatsApp] = useState(false)
  const [hasTelegram, setHasTelegram] = useState(false)
  const [contactInstruction, setContactInstruction] = useState<'sms_and_call' | 'sms_only' | 'no_sms'>('sms_and_call')
  const [noWithheldNumbers, setNoWithheldNumbers] = useState(false)
  const [otherInstructions, setOtherInstructions] = useState('')

  // Pictures/Video (Step 11)
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{ id: string; file_name: string; file_path: string }>>([])
  const [uploadedVideos, setUploadedVideos] = useState<Array<{ id: string; file_name: string; file_path: string }>>([])
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [uploadingVideos, setUploadingVideos] = useState(false)

  const t = useTranslations('onboarding.model')

  const languageLabel = (name: string) =>
    t(`langName.${name.toLowerCase().replace(/ /g, '_')}` as Parameters<typeof t>[0])

  const durationOptions = useMemo(
    () => [
      { value: '30_minutes', label: t('dur.30m') },
      { value: '1_hour', label: t('dur.1h') },
      { value: '2_hours', label: t('dur.2h') },
      { value: 'specific_time', label: t('dur.specific') },
      { value: 'additional_hour', label: t('dur.additional') },
      { value: 'overnight', label: t('dur.overnight') },
      { value: 'dinner_date', label: t('dur.dinner') },
      { value: 'weekend', label: t('dur.weekend') },
    ],
    [t],
  )

  // Fetch services and cities from database
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .order('category, display_order')
      
      if (!servicesError && servicesData) {
        setServices(servicesData)
      }
      
      // Cities are now handled by the CitySearch component
    }
    
    fetchData()
  }, [])

  useEffect(() => {
    const loadExistingMedia = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [photosRes, videosRes] = await Promise.all([
        supabase
          .from('model_photos')
          .select('id, file_name, file_path')
          .eq('model_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('model_videos')
          .select('id, file_name, file_path')
          .eq('model_id', user.id)
          .order('created_at', { ascending: true }),
      ])

      const photos = photosRes.data
      if (photos?.length) {
        setUploadedPhotos(photos.map((p) => ({ id: p.id, file_name: p.file_name, file_path: p.file_path })))
      }
      const videos = videosRes.data
      if (videos?.length) {
        setUploadedVideos(videos.map((v) => ({ id: v.id, file_name: v.file_name, file_path: v.file_path })))
      }
    }
    loadExistingMedia()
  }, [])

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleArrayOption = (field: 'incall_options' | 'outcall_options' | 'services_for', value: string) => {
    const currentArray = formData[field]
    if (currentArray.includes(value)) {
      handleChange(field, currentArray.filter(item => item !== value))
    } else {
      handleChange(field, [...currentArray, value])
    }
  }

  const handleAddMore = () => {
    if (!primaryLanguage) {
      setError(t('err.selectLanguageFirst'))
      return
    }
    
    // Add primary language to the list with a default level
    setLanguages([{ language: primaryLanguage, level: 'good' }])
    setShowAdvancedLanguages(true)
    setError('')
  }

  const addAdditionalLanguage = (language: string, level: string) => {
    if (!language) {
      setError(t('err.selectLanguage'))
      return
    }
    
    if (!level) {
      setError(t('err.selectLevel'))
      return
    }
    
    // Check if language already exists
    if (languages.find(l => l.language === language)) {
      setError(t('err.languageExists'))
      return
    }
    
    // Max 5 languages
    if (languages.length >= 5) {
      setError(t('err.maxLanguages'))
      return
    }
    
    setLanguages([...languages, { language, level }])
    setError('')
  }

  const removeLanguage = (languageToRemove: string) => {
    setLanguages(languages.filter(l => l.language !== languageToRemove))
  }

  const updateLanguageLevel = (language: string, newLevel: string) => {
    setLanguages(languages.map(l => 
      l.language === language ? { ...l, level: newLevel } : l
    ))
  }

  // Services helpers
  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId))
    } else {
      setSelectedServices([...selectedServices, serviceId])
    }
  }

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      // Close the category if it's already open
      setExpandedCategories([])
    } else {
      // Open this category and close all others
      setExpandedCategories([category])
    }
  }

  const getServicesByCategory = (category: string) => {
    return services.filter(s => s.category === category)
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, Parameters<typeof t>[0]> = {
      main: 'cat.main',
      extra: 'cat.extra',
      fetish_bizarre: 'cat.fetish',
      virtual: 'cat.virtual',
      massage: 'cat.massage',
    }
    const k = labels[category]
    return k ? t(k) : category
  }

  const getSelectedCountByCategory = (category: string) => {
    const categoryServices = getServicesByCategory(category)
    return categoryServices.filter(s => selectedServices.includes(s.id)).length
  }

  // Working Hours helpers
  const updateCustomHours = (day: string, field: 'from' | 'to', value: string) => {
    setCustomHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }))
  }

  // Rates helpers
  const addIncallRate = () => {
    if (!incallAmount || parseFloat(incallAmount) <= 0) {
      alert(t('alert.validAmount'))
      return
    }
    
    // For specific_time, validate custom time
    if (incallDuration === 'specific_time') {
      if (!incallCustomTime || parseFloat(incallCustomTime) <= 0) {
        alert(t('alert.validTime'))
        return
      }
    }
    
    // Check if duration already exists (for specific_time, check the custom time too)
    if (incallDuration === 'specific_time') {
      const existingCustom = incallRates.find(
        r => r.duration === 'specific_time' && 
             r.customTime === incallCustomTime && 
             r.customUnit === incallCustomUnit
      )
      if (existingCustom) {
        alert(t('alert.durationExistsCustom'))
        return
      }
    } else {
      if (incallRates.some(r => r.duration === incallDuration)) {
        alert(t('alert.durationExists'))
        return
      }
    }
    
    const newRate: any = { 
      duration: incallDuration, 
      amount: incallAmount 
    }
    
    if (incallDuration === 'specific_time') {
      newRate.customTime = incallCustomTime
      newRate.customUnit = incallCustomUnit
    }
    
    setIncallRates([...incallRates, newRate])
    setIncallAmount('')
    setIncallCustomTime('')
    setIncallCustomUnit('hours')
    setIncallDuration('30_minutes')
  }

  const addOutcallRate = () => {
    if (!outcallAmount || parseFloat(outcallAmount) <= 0) {
      alert(t('alert.validAmount'))
      return
    }
    
    // For specific_time, validate custom time
    if (outcallDuration === 'specific_time') {
      if (!outcallCustomTime || parseFloat(outcallCustomTime) <= 0) {
        alert(t('alert.validTime'))
        return
      }
    }
    
    // Check if duration already exists (for specific_time, check the custom time too)
    if (outcallDuration === 'specific_time') {
      const existingCustom = outcallRates.find(
        r => r.duration === 'specific_time' && 
             r.customTime === outcallCustomTime && 
             r.customUnit === outcallCustomUnit
      )
      if (existingCustom) {
        alert(t('alert.durationExistsCustom'))
        return
      }
    } else {
      if (outcallRates.some(r => r.duration === outcallDuration)) {
        alert(t('alert.durationExists'))
        return
      }
    }
    
    const newRate: any = { 
      duration: outcallDuration, 
      amount: outcallAmount 
    }
    
    if (outcallDuration === 'specific_time') {
      newRate.customTime = outcallCustomTime
      newRate.customUnit = outcallCustomUnit
    }
    
    setOutcallRates([...outcallRates, newRate])
    setOutcallAmount('')
    setOutcallCustomTime('')
    setOutcallCustomUnit('hours')
    setOutcallDuration('1_hour')
  }

  const removeIncallRate = (duration: string, customTime?: string, customUnit?: string) => {
    setIncallRates(incallRates.filter(r => {
      if (duration === 'specific_time') {
        return !(r.duration === duration && r.customTime === customTime && r.customUnit === customUnit)
      }
      return r.duration !== duration
    }))
  }

  const removeOutcallRate = (duration: string, customTime?: string, customUnit?: string) => {
    setOutcallRates(outcallRates.filter(r => {
      if (duration === 'specific_time') {
        return !(r.duration === duration && r.customTime === customTime && r.customUnit === customUnit)
      }
      return r.duration !== duration
    }))
  }

  const getDurationLabel = (value: string, customTime?: string, customUnit?: string) => {
    if (value === 'specific_time' && customTime && customUnit) {
      return `${customTime} ${customUnit === 'minutes' ? t('unit.minutes') : t('unit.hours')}`
    }
    return durationOptions.find(opt => opt.value === value)?.label || value
  }

  // Media upload helpers
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
          alert(t('alert.fileTooLarge', { name: rawFile.name }))
          continue
        }

        // Compress + watermark
        const file = await processImage(rawFile)
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`
        const filePath = `${user.email}/photos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('model-photos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create metadata record
        const { data: photoData, error: dbError } = await supabase
          .from('model_photos')
          .insert({
            model_id: user.id,
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
      alert(t('alert.uploadPhotosFail'))
    } finally {
      setUploadingPhotos(false)
      // Reset input
      e.target.value = ''
    }
  }

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
          alert(t('alert.videoTooLarge', { name: file.name }))
          continue
        }

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/x-msvideo', 'video/x-matroska']
        if (!allowedTypes.includes(file.type)) {
          alert(t('alert.videoFormat', { name: file.name }))
          continue
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.email}/videos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('model-videos')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create metadata record
        const { data: videoData, error: dbError } = await supabase
          .from('model_videos')
          .insert({
            model_id: user.id,
            file_path: filePath,
            file_name: file.name,
            is_approved: true
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
      alert(t('alert.uploadVideosFail'))
    } finally {
      setUploadingVideos(false)
      // Reset input
      e.target.value = ''
    }
  }

  const deletePhoto = async (photoId: string, filePath: string) => {
    if (!confirm(t('confirm.deletePhoto'))) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('model-photos')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('model_photos')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      // Remove from state
      setUploadedPhotos(prev => prev.filter(p => p.id !== photoId))
    } catch (err: any) {
      console.error('Error deleting photo:', err)
      alert(t('alert.deletePhotoFail'))
    }
  }

  const deleteVideo = async (videoId: string, filePath: string) => {
    if (!confirm(t('confirm.deleteVideo'))) return

    try {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('model-videos')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('model_videos')
        .delete()
        .eq('id', videoId)

      if (dbError) throw dbError

      // Remove from state
      setUploadedVideos(prev => prev.filter(v => v.id !== videoId))
    } catch (err: any) {
      console.error('Error deleting video:', err)
      alert(t('alert.deleteVideoFail'))
    }
  }

  const validateStep1 = () => {
    if (!formData.showname || !formData.gender) {
      setError(t('err.shownameGender'))
      return false
    }
    if (!phoneNumber.trim()) {
      setError(t('err.phone'))
      return false
    }
    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 100)) {
      setError(t('err.ageRange'))
      return false
    }
    return true
  }

  const validateStep4 = () => {
    // Description is optional now - no minimum character requirement
    return true
  }

  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault()
    setError('')
    
    if (currentStep === 1 && !validateStep1()) return
    if (currentStep === 4 && !validateStep4()) return

    setCurrentStep(prev => prev + 1)
  }

  const handleBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault()
    setError('')
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateStep1()) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const modelDetailsData = {
        model_id: user.id,
        showname: formData.showname || null,
        slogan: formData.slogan || null,
        gender: formData.gender || null,
        ethnicity: formData.ethnicity || null,
        nationality: formData.nationality || null,
        age: formData.age ? parseInt(formData.age) : null,
      }

      const { error: detailsError } = await supabase
        .from('model_details')
        .upsert(modelDetailsData, { onConflict: 'model_id' })

      if (detailsError) throw detailsError

      if (phoneNumber.trim()) {
        const { error: contactError } = await supabase
          .from('model_contact_details')
          .upsert({
            model_id: user.id,
            country_code: countryCode,
            phone_number: phoneNumber.trim(),
          }, { onConflict: 'model_id' })

        if (contactError) throw contactError
      }

      const completeRes = await fetch('/api/onboarding/complete', { method: 'POST' })
      if (!completeRes.ok) {
        const body = await completeRes.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'Failed to complete onboarding')
      }

      await refreshProfile()
      router.push('/dashboard/model')
      router.refresh()
    } catch (err: any) {
      console.error('Error saving model details:', err)
      setError(err.message || t('err.saveDetails'))
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 1

  return (
    <div className="max-w-3xl mx-auto w-full min-w-0 overflow-x-hidden">
      <form onSubmit={handleSubmit} className="pb-2">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-2.5 rounded-lg mb-4">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* STEP 1: Basic BIO */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">{t('s1.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Showname */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('s1.showname')} <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.showname}
                  onChange={(e) => handleChange('showname', e.target.value)}
                  placeholder={t('s1.shownamePh')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t('s1.gender')} <span className="text-pink-600">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  required
                >
                  <option value="">{t('selectGender')}</option>
                  <option value="female">{t('s1.genderFemale')}</option>
                  <option value="male">{t('s1.genderMale')}</option>
                  <option value="trans">{t('s1.genderTrans')}</option>
                </select>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {t('s1.phone')} <span className="text-pink-600">*</span>
              </label>
              <div className="flex flex-row gap-2 items-stretch max-w-full">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-[110px] sm:w-36 md:w-40 min-w-0 px-2 sm:px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 flex-shrink-0"
                >
                  <option value="+41">🇨🇭 +41</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+43">🇦🇹 +43</option>
                  <option value="+39">🇮🇹 +39</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+420">🇨🇿 +420</option>
                  <option value="+48">🇵🇱 +48</option>
                  <option value="+7">🇷🇺 +7</option>
                  <option value="+380">🇺🇦 +380</option>
                  <option value="+40">🇷🇴 +40</option>
                  <option value="+381">🇷🇸 +381</option>
                  <option value="+385">🇭🇷 +385</option>
                  <option value="+386">🇸🇮 +386</option>
                  <option value="+36">🇭🇺 +36</option>
                  <option value="+421">🇸🇰 +421</option>
                  <option value="+90">🇹🇷 +90</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+351">🇵🇹 +351</option>
                </select>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t('s1.phonePh')}
                  className="w-full min-w-0 flex-1 px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">{t('optional')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* 2×2 grid: Slogan, Ethnicity, Nationality, Age */}
            <div className="grid grid-cols-2 gap-3">
              {/* Slogan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('s1.slogan')}</label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  placeholder={t('s1.sloganPh')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Ethnicity */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('s1.ethnicity')}</label>
                <select
                  value={formData.ethnicity}
                  onChange={(e) => handleChange('ethnicity', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">{t('selectEthnicity')}</option>
                  <option value="asian">{t('eth.asian')}</option>
                  <option value="black">{t('eth.black')}</option>
                  <option value="caucasian_white">{t('eth.caucasian_white')}</option>
                  <option value="latin">{t('eth.latin')}</option>
                  <option value="mixed">{t('eth.mixed')}</option>
                  <option value="indian">{t('eth.indian')}</option>
                  <option value="arab">{t('eth.arab')}</option>
                  <option value="caucasian">{t('eth.caucasian')}</option>
                </select>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('s1.nationality')}</label>
                <select
                  value={formData.nationality}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">{t('selectNationality')}</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('s1.age')}</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder={t('s1.agePh')}
                  min="18"
                  max="100"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>
            </div>

            {/* Photos Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">{t('s1.photos')}</label>

              {/* Drop zone */}
              <label htmlFor="photo-upload-step1" className="block">
                <div
                  className="flex items-center justify-center gap-3 w-full py-4 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                  style={{ borderColor: '#f9a8d4', background: '#fef7fa' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fce7f3' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#fef7fa' }}
                >
                  {uploadingPhotos ? (
                    <>
                      <svg className="w-5 h-5 animate-spin text-pink-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span className="text-sm font-semibold text-pink-500">{t('s1.uploading')}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#fce7f3' }}>
                        <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-pink-500">{t('s1.clickUpload')}</p>
                        <p className="text-xs text-gray-400">{t('s1.photoHint')}</p>
                      </div>
                    </>
                  )}
                </div>
              </label>
              <input
                id="photo-upload-step1"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                disabled={uploadingPhotos}
                className="hidden"
              />

              {/* Uploaded photos grid */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {uploadedPhotos.map((photo) => (
                    <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${photo.file_path}`}
                        alt={photo.file_name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => deletePhoto(photo.id, photo.file_path)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.45)' }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadedPhotos.length === 0 && (
                <p className="text-xs text-gray-400">{t('s1.noPhotosYet')}</p>
              )}
            </div>

          </div>
        )}

        {/* STEP 2: Physical Features */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s2.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hair Color */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s2.hairColor')}
                </label>
                <select
                  value={formData.hair_color}
                  onChange={(e) => handleChange('hair_color', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">{t('selectHair')}</option>
                  <option value="blond">{t('s2.hairBlond')}</option>
                  <option value="light_brown">{t('s2.hairLightBrown')}</option>
                  <option value="brunette">{t('s2.hairBrunette')}</option>
                  <option value="black">{t('s2.hairBlack')}</option>
                  <option value="red">{t('s2.hairRed')}</option>
                  <option value="other">{t('s2.hairOther')}</option>
                </select>
              </div>

              {/* Eye Color */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s2.eyeColor')}
                </label>
                <select
                  value={formData.eye_color}
                  onChange={(e) => handleChange('eye_color', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">{t('selectEye')}</option>
                  <option value="black">{t('s2.eyeBlack')}</option>
                  <option value="brown">{t('s2.eyeBrown')}</option>
                  <option value="green">{t('s2.eyeGreen')}</option>
                  <option value="blue">{t('s2.eyeBlue')}</option>
                  <option value="gray">{t('s2.eyeGray')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Height */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s2.height')}
                </label>
                <input
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => handleChange('height_cm', e.target.value)}
                  placeholder={t('s2.heightPh')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s2.weight')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => handleChange('weight_kg', e.target.value)}
                  placeholder={t('s2.weightPh')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Dress Size */}
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s2.dressSize')}
                </label>
                <select
                  value={formData.dress_size}
                  onChange={(e) => handleChange('dress_size', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">{t('selectSize')}</option>
                  <option value="xs">XS</option>
                  <option value="s">S</option>
                  <option value="m">M</option>
                  <option value="l">L</option>
                  <option value="xl">XL</option>
                  <option value="xxl">XXL</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Bust */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s2.bust')}
                </label>
                <input
                  type="number"
                  value={formData.bust_cm}
                  onChange={(e) => handleChange('bust_cm', e.target.value)}
                  placeholder={t('s2.heightPh')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Waist */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s2.waist')}
                </label>
                <input
                  type="number"
                  value={formData.waist_cm}
                  onChange={(e) => handleChange('waist_cm', e.target.value)}
                  placeholder={t('s2.heightPh')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Hip */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s2.hip')}
                </label>
                <input
                  type="number"
                  value={formData.hip_cm}
                  onChange={(e) => handleChange('hip_cm', e.target.value)}
                  placeholder={t('s2.heightPh')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>
            </div>

            {/* Pubic Hair */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('s2.pubicHair')}
              </label>
              <select
                value={formData.pubic_hair}
                onChange={(e) => handleChange('pubic_hair', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
              >
                <option value="">{t('selectOption')}</option>
                <option value="shaved_completely">{t('s2.pubicShavedFull')}</option>
                <option value="shaved_mostly">{t('s2.pubicShavedMost')}</option>
                <option value="trimmed">{t('s2.pubicTrimmed')}</option>
                <option value="all_natural">{t('s2.pubicNatural')}</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: Additional Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s3.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Smoking */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s3.smoking')}
                </label>
                <select
                  value={formData.smoking}
                  onChange={(e) => handleChange('smoking', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">{t('selectOption')}</option>
                  <option value="yes">{t('s3.yes')}</option>
                  <option value="no">{t('s3.no')}</option>
                  <option value="occasionally">{t('s3.occasionally')}</option>
                </select>
              </div>

              {/* Drinking */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  {t('s3.drinking')}
                </label>
                <select
                  value={formData.drinking}
                  onChange={(e) => handleChange('drinking', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">{t('selectOption')}</option>
                  <option value="yes">{t('s3.yes')}</option>
                  <option value="no">{t('s3.no')}</option>
                  <option value="occasionally">{t('s3.occasionally')}</option>
                </select>
              </div>
            </div>

            {/* Special Characteristics */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('s3.specialChars')}
              </label>
              <textarea
                value={formData.special_characteristics}
                onChange={(e) => handleChange('special_characteristics', e.target.value)}
                placeholder={t('s3.specialCharsPh')}
                rows={4}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: About Me */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s4.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('s4.intro')}
            </p>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {t('s4.describe')}
              </label>
              <RichTextEditor
                value={formData.about_me}
                onChange={(val) => handleChange('about_me', val)}
                placeholder={t('s4.placeholder')}
                maxLength={25000}
                height={300}
              />
            </div>
          </div>
        )}

        {/* STEP 5: Languages */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s5.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {t('s5.intro')}
            </p>
            
            {!showAdvancedLanguages ? (
              /* Simple mode - just one primary language */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t('s5.language')}
                  </label>
                  <select
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  >
                    <option value="">{t('selectLanguage')}</option>
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{languageLabel(lang)}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddMore}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {t('s5.addMore')}
                </button>
              </div>
            ) : (
              /* Advanced mode - multiple languages with levels */
              <div className="space-y-6">
                <p className="text-sm text-gray-500 italic">
                  {t('s5.advancedHint')}
                </p>

                {/* Languages List with Level Selection */}
                <div className="space-y-4">
                  {languages.map((lang, index) => (
                    <div key={`${lang.language}-${index}`} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-900">{languageLabel(lang.language)}</span>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeLanguage(lang.language)}
                            className="text-red-600 hover:text-red-700 transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                          {t('lang.level')}
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: 'basic', label: t('lang.levelBasic') },
                            { value: 'fair', label: t('lang.levelFair') },
                            { value: 'good', label: t('lang.levelGood') },
                            { value: 'excellent_native', label: t('lang.levelExcellent') }
                          ].map((level) => (
                            <button
                              key={level.value}
                              type="button"
                              onClick={() => updateLanguageLevel(lang.language, level.value)}
                              className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all ${
                                lang.level === level.value
                                  ? 'bg-pink-600 text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                              }`}
                            >
                              {level.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Another Language */}
                {languages.length < 5 && (
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <NewLanguageInput 
                      languages={languages}
                      onAdd={addAdditionalLanguage}
                      availableLanguages={LANGUAGES}
                    />
                  </div>
                )}

                {languages.length >= 5 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                    <p className="text-sm text-yellow-700 font-medium">
                      {t('s5.maxReached')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Area / Location */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s6.title')}</h2>
            
            {/* City */}
            <div>
              <CitySearch
                value={formData.city}
                onChange={(city) => handleChange('city', city?.name || '')}
                label={t('s6.city')}
                placeholder={t('s6.cityPh')}
                inputClassName="border-2 border-gray-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-200"
              />
            </div>

            {/* Incall Options */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('s6.incall')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {INCALL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleArrayOption('incall_options', option.value)}
                    className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
                      formData.incall_options.includes(option.value)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t(option.key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Outcall Options */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('s6.outcall')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {OUTCALL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleArrayOption('outcall_options', option.value)}
                    className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
                      formData.outcall_options.includes(option.value)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t(option.key)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Services */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s7.title')}</h2>
            
            {/* Sexual Orientation */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('s7.orientation')}
              </label>
              <select
                value={formData.sexual_orientation}
                onChange={(e) => handleChange('sexual_orientation', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
              >
                <option value="">{t('s7.orientationSelect')}</option>
                <option value="heterosexual">{t('s7.oriHetero')}</option>
                <option value="bisexual">{t('s7.oriBi')}</option>
                <option value="homosexual">{t('s7.oriHomo')}</option>
              </select>
            </div>

            {/* Services Offered For */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('s7.offeredFor')}
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { value: 'men', labelKey: 's7.forMen' as const },
                  { value: 'women', labelKey: 's7.forWomen' as const },
                  { value: 'couples', labelKey: 's7.forCouples' as const },
                  { value: 'trans', labelKey: 's7.forTrans' as const },
                  { value: 'gays', labelKey: 's7.forGays' as const },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleArrayOption('services_for', option.value)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                      formData.services_for.includes(option.value)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Services Categories */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">{t('s7.servicesHeading')}</h3>
              
              {['main', 'extra', 'fetish_bizarre', 'virtual', 'massage'].map((category) => {
                const categoryServices = getServicesByCategory(category)
                const isExpanded = expandedCategories.includes(category)
                const selectedCount = getSelectedCountByCategory(category)
                const totalCount = categoryServices.length
                
                return (
                  <div key={category} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-pink-600">
                          {getCategoryLabel(category)}
                        </span>
                        <span className="text-xs text-gray-600">
                          {selectedCount}/{totalCount}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {/* Category Services */}
                    {isExpanded && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2 bg-white">
                        {categoryServices.map((service: any) => (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleService(service.id)}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all text-left ${
                              selectedServices.includes(service.id)
                                ? 'bg-pink-100 border-2 border-pink-500 text-pink-900'
                                : 'bg-gray-50 border-2 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                              selectedServices.includes(service.id)
                                ? 'bg-pink-600'
                                : 'bg-white border-2 border-gray-300'
                            }`}>
                              {selectedServices.includes(service.id) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span>{service.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Selected Services Summary */}
            {selectedServices.length > 0 && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-sm text-green-800 font-semibold">
                  {t('s7.selected', { count: selectedServices.length })}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 8: Working Hours */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s8.title')}</h2>
            
            {/* Schedule Type Selection */}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setScheduleType('24_7')}
                className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                  scheduleType === '24_7'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('s8.avail247')}
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
                {t('s8.sameDaily')}
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('custom')}
                className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                  scheduleType === 'custom'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t('s8.custom')}
              </button>
            </div>

            {/* Custom Schedule */}
            {scheduleType === 'custom' && (
              <div className="space-y-4">
                {WEEKDAY_ORDER.map((day) => (
                  <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-bold text-gray-700">
                      {t(`day.${day}`)}
                    </label>
                    <div>
                      <input
                        type="time"
                        value={customHours[day as keyof typeof customHours].from}
                        onChange={(e) => updateCustomHours(day, 'from', e.target.value)}
                        placeholder={t('s8.from')}
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 cursor-pointer"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        value={customHours[day as keyof typeof customHours].to}
                        onChange={(e) => updateCustomHours(day, 'to', e.target.value)}
                        placeholder={t('s8.to')}
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 cursor-pointer"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Same Every Day */}
            {scheduleType === 'same_every_day' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t('s8.from')}
                  </label>
                  <input
                    type="time"
                    value={sameEveryDayHours.from}
                    onChange={(e) => setSameEveryDayHours({ ...sameEveryDayHours, from: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    {t('s8.to')}
                  </label>
                  <input
                    type="time"
                    value={sameEveryDayHours.to}
                    onChange={(e) => setSameEveryDayHours({ ...sameEveryDayHours, to: e.target.value })}
                    className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                  />
                </div>
              </div>
            )}

            {/* 24/7 Info */}
            {scheduleType === '24_7' && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-sm text-green-800 font-semibold">
                  {t('s8.avail247Note')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 9: Rates */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s9.title')}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Incall Rates */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">{t('s9.incallRates')}</h3>
                
                {/* Add Incall Rate Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {t('s9.duration')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={incallDuration}
                      onChange={(e) => setIncallDuration(e.target.value)}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                    >
                      {durationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Custom Time Input (only for specific_time) */}
                  {incallDuration === 'specific_time' && (
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={incallCustomTime}
                          onChange={(e) => setIncallCustomTime(e.target.value)}
                          placeholder={t('dur.timePh')}
                          min="1"
                          step="1"
                          className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                        />
                      </div>
                      <select
                        value={incallCustomUnit}
                        onChange={(e) => setIncallCustomUnit(e.target.value)}
                        className="px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                      >
                        <option value="minutes">{t('unit.minutes')}</option>
                        <option value="hours">{t('unit.hours')}</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={incallAmount}
                        onChange={(e) => setIncallAmount(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 px-3 py-3">{t('chf')}</span>
                    <button
                      type="button"
                      onClick={addIncallRate}
                      className="px-6 py-3 text-sm font-bold text-pink-600 border-2 border-pink-600 rounded-lg hover:bg-pink-50 transition-all"
                    >
                      {t('add')}
                    </button>
                  </div>
                </div>

                {/* Incall Rates List */}
                {incallRates.length === 0 ? (
                  <p className="text-sm text-gray-500 italic mt-4">{t('s9.noRates')}</p>
                ) : (
                  <div className="space-y-2 mt-4">
                    {incallRates.map((rate, index) => (
                      <div
                        key={`${rate.duration}-${rate.customTime}-${rate.customUnit}-${index}`}
                        className="flex items-center justify-between p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg"
                      >
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {getDurationLabel(rate.duration, rate.customTime, rate.customUnit)}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            {rate.amount} {t('chf')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIncallRate(rate.duration, rate.customTime, rate.customUnit)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          {t('remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outcall Rates */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">{t('s9.outcallRates')}</h3>
                
                {/* Add Outcall Rate Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      {t('s9.duration')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={outcallDuration}
                      onChange={(e) => setOutcallDuration(e.target.value)}
                      className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                    >
                      {durationOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Custom Time Input (only for specific_time) */}
                  {outcallDuration === 'specific_time' && (
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={outcallCustomTime}
                          onChange={(e) => setOutcallCustomTime(e.target.value)}
                          placeholder={t('dur.timePh')}
                          min="1"
                          step="1"
                          className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                        />
                      </div>
                      <select
                        value={outcallCustomUnit}
                        onChange={(e) => setOutcallCustomUnit(e.target.value)}
                        className="px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                      >
                        <option value="minutes">{t('unit.minutes')}</option>
                        <option value="hours">{t('unit.hours')}</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        value={outcallAmount}
                        onChange={(e) => setOutcallAmount(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="1"
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 px-3 py-3">{t('chf')}</span>
                    <button
                      type="button"
                      onClick={addOutcallRate}
                      className="px-6 py-3 text-sm font-bold text-pink-600 border-2 border-pink-600 rounded-lg hover:bg-pink-50 transition-all"
                    >
                      {t('add')}
                    </button>
                  </div>
                </div>

                {/* Outcall Rates List */}
                {outcallRates.length === 0 ? (
                  <p className="text-sm text-gray-500 italic mt-4">{t('s9.noRates')}</p>
                ) : (
                  <div className="space-y-2 mt-4">
                    {outcallRates.map((rate, index) => (
                      <div
                        key={`${rate.duration}-${rate.customTime}-${rate.customUnit}-${index}`}
                        className="flex items-center justify-between p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg"
                      >
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {getDurationLabel(rate.duration, rate.customTime, rate.customUnit)}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            {rate.amount} {t('chf')}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOutcallRate(rate.duration, rate.customTime, rate.customUnit)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          {t('remove')}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: Contact Details */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s10.title')}</h2>
            
            {/* Phone Number Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showPhoneNumber"
                  checked={showPhoneNumber}
                  onChange={(e) => setShowPhoneNumber(e.target.checked)}
                  className="w-5 h-5 text-pink-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-pink-500 cursor-pointer"
                />
                <label htmlFor="showPhoneNumber" className="text-sm font-bold text-gray-900 cursor-pointer">
                  {t('s10.showPhone')}
                </label>
              </div>

              <div className="grid grid-cols-[110px_1fr] md:grid-cols-2 gap-3 md:gap-4">
                <div className="min-w-0">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t('s10.countryCode')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-2 md:px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  >
                    <option value="+41">Switzerland (+41)</option>
                    <option value="+49">Germany (+49)</option>
                    <option value="+43">Austria (+43)</option>
                    <option value="+39">Italy (+39)</option>
                    <option value="+33">France (+33)</option>
                    <option value="+44">United Kingdom (+44)</option>
                    <option value="+1">USA/Canada (+1)</option>
                    <option value="+420">Czech Republic (+420)</option>
                    <option value="+48">Poland (+48)</option>
                    <option value="+7">Russia (+7)</option>
                    <option value="+380">Ukraine (+380)</option>
                    <option value="+40">Romania (+40)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {t('s10.phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('s10.phonePh')}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('s10.phoneHint')}
                  </p>
                </div>
              </div>

              {/* Contact Apps */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setHasViber(!hasViber)}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                    hasViber
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {hasViber && '✓ '}Viber
                </button>
                <button
                  type="button"
                  onClick={() => setHasWhatsApp(!hasWhatsApp)}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                    hasWhatsApp
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {hasWhatsApp && '✓ '}WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setHasTelegram(!hasTelegram)}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                    hasTelegram
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {hasTelegram && '✓ '}Telegram
                </button>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">{t('s10.instructions')}</h3>
              
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setContactInstruction('sms_and_call')}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                    contactInstruction === 'sms_and_call'
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t('s10.smsCall')}
                </button>
                <button
                  type="button"
                  onClick={() => setContactInstruction('sms_only')}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                    contactInstruction === 'sms_only'
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t('s10.smsOnly')}
                </button>
                <button
                  type="button"
                  onClick={() => setContactInstruction('no_sms')}
                  className={`px-6 py-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                    contactInstruction === 'no_sms'
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t('s10.noSms')}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="noWithheldNumbers"
                  checked={noWithheldNumbers}
                  onChange={(e) => setNoWithheldNumbers(e.target.checked)}
                  className="w-5 h-5 text-pink-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-pink-500 cursor-pointer"
                />
                <label htmlFor="noWithheldNumbers" className="text-sm font-semibold text-gray-900 cursor-pointer">
                  {t('s10.noWithheld')}
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {t('s10.other')}
                </label>
                <textarea
                  value={otherInstructions}
                  onChange={(e) => setOtherInstructions(e.target.value)}
                  placeholder={t('s10.otherPh')}
                  rows={3}
                  className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 11: Pictures / Video */}
        {currentStep === 11 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('s11.title')}</h2>
            
            {/* Photos Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('s11.reqTitle')}</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>{t('s11.req1')}</li>
                  <li>{t('s11.req2')}</li>
                  <li>{t('s11.req3')}</li>
                  <li>{t('s11.req4')}</li>
                </ul>
              </div>

              <div>
                <label htmlFor="photo-upload" className="block">
                  <div className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg text-center cursor-pointer inline-block">
                    {uploadingPhotos ? t('s11.uploadingCaps') : t('s11.uploadPhoto')}
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
                <p className="text-sm text-gray-500 italic">{t('s11.galleryEmpty')}</p>
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
                        {t('delete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Video Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('s11.videoTitle')}</h3>
                <p className="text-sm text-gray-700 mb-2">
                  {t('s11.videoIntro')}
                </p>
                <h4 className="text-sm font-bold text-gray-900 mb-1">{t('s11.videoReqTitle')}</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>{t('s11.vreq1')}</li>
                  <li>{t('s11.vreq2')}</li>
                  <li>{t('s11.vreq3')}</li>
                  <li>{t('s11.vreq4')}</li>
                </ul>
              </div>

              <div>
                <label htmlFor="video-upload" className="block">
                  <div className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg text-center cursor-pointer inline-block">
                    {uploadingVideos ? t('s11.uploadingCaps') : t('s11.uploadVideos')}
                  </div>
                </label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-ms-wmv,video/x-flv,video/x-msvideo,video/x-matroska"
                  multiple
                  onChange={handleVideoUpload}
                  disabled={uploadingVideos}
                  className="hidden"
                />
              </div>

              {/* Uploaded Videos */}
              {uploadedVideos.length === 0 ? (
                <p className="text-sm text-gray-500 italic">{t('s11.noVideos')}</p>
              ) : (
                <div className="space-y-3">
                  {uploadedVideos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{video.file_name}</p>
                        <p className="text-xs text-gray-500">{t('s11.pendingVerification')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteVideo(video.id, video.file_path)}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">{t('s11.noteTitle')}</span>{' '}{t('s11.noteBody')}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              {t('nav.back')}
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg"
            >
              {t('nav.next')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 text-white rounded-lg font-bold transition-all shadow-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(90deg, #ec4899, #f472b6)', boxShadow: 'rgba(236,72,153,0.25) 0px 2px 10px' }}
            >
              {loading ? t('nav.saving') : t('nav.finish')}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
