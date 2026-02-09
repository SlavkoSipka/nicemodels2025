'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { X, Plus, ChevronDown, ChevronUp } from 'lucide-react'

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
          Add Another Language
        </label>
        <select
          value={newLang}
          onChange={(e) => setNewLang(e.target.value)}
          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
        >
          <option value="">Select language</option>
          {availableLanguages
            .filter(lang => !languages.find(l => l.language === lang))
            .map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
        </select>
      </div>

      {newLang && (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-2">
            Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'basic', label: 'Basic' },
              { value: 'fair', label: 'Fair' },
              { value: 'good', label: 'Good' },
              { value: 'excellent_native', label: 'Excellent' }
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
  
  // Cities (Step 6)
  const [cities, setCities] = useState<any[]>([])
  
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

  const durationOptions = [
    { value: '30_minutes', label: '30 minutes' },
    { value: '1_hour', label: '1 hour' },
    { value: '2_hours', label: '2 hours' },
    { value: 'specific_time', label: 'For a specific time' },
    { value: 'additional_hour', label: 'Additional hour' },
    { value: 'overnight', label: 'Overnight' },
    { value: 'dinner_date', label: 'Dinner date' },
    { value: 'weekend', label: 'Weekend' },
  ]

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
      
      // Fetch cities
      const { data: citiesData, error: citiesError } = await supabase
        .from('cities')
        .select('*')
        .order('name')
      
      if (!citiesError && citiesData) {
        setCities(citiesData)
      }
    }
    
    fetchData()
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
      setError('Please select a language first')
      return
    }
    
    // Add primary language to the list with a default level
    setLanguages([{ language: primaryLanguage, level: 'good' }])
    setShowAdvancedLanguages(true)
    setError('')
  }

  const addAdditionalLanguage = (language: string, level: string) => {
    if (!language) {
      setError('Please select a language')
      return
    }
    
    if (!level) {
      setError('Please select a level')
      return
    }
    
    // Check if language already exists
    if (languages.find(l => l.language === language)) {
      setError('Language already added')
      return
    }
    
    // Max 5 languages
    if (languages.length >= 5) {
      setError('Maximum 5 languages allowed')
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
    const labels: Record<string, string> = {
      'main': 'Main Services',
      'extra': 'Extra Services',
      'fetish_bizarre': 'Fetish / Bizarre',
      'virtual': 'Virtual Services',
      'massage': 'Massage services without sex!'
    }
    return labels[category] || category
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
      alert('Please enter a valid amount')
      return
    }
    
    // For specific_time, validate custom time
    if (incallDuration === 'specific_time') {
      if (!incallCustomTime || parseFloat(incallCustomTime) <= 0) {
        alert('Please enter a valid time duration')
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
        alert('This specific time duration already exists. Please remove it first.')
        return
      }
    } else {
      if (incallRates.some(r => r.duration === incallDuration)) {
        alert('This duration already exists. Please remove it first.')
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
      alert('Please enter a valid amount')
      return
    }
    
    // For specific_time, validate custom time
    if (outcallDuration === 'specific_time') {
      if (!outcallCustomTime || parseFloat(outcallCustomTime) <= 0) {
        alert('Please enter a valid time duration')
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
        alert('This specific time duration already exists. Please remove it first.')
        return
      }
    } else {
      if (outcallRates.some(r => r.duration === outcallDuration)) {
        alert('This duration already exists. Please remove it first.')
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
      return `${customTime} ${customUnit}`
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

      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} is too large. Max size is 10MB.`)
          continue
        }

        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
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
      alert('Failed to upload photos. Please try again.')
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
      alert('Failed to upload videos. Please try again.')
    } finally {
      setUploadingVideos(false)
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
      alert('Failed to delete photo.')
    }
  }

  const deleteVideo = async (videoId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return

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
      alert('Failed to delete video.')
    }
  }

  const validateStep1 = () => {
    if (!formData.showname || !formData.gender) {
      setError('Showname and Gender are required')
      return false
    }
    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 100)) {
      setError('Age must be between 18 and 100')
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
    
    console.log('Moving to step:', currentStep + 1)
    setCurrentStep(prev => prev + 1)
  }

  const handleBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault()
    setError('')
    setCurrentStep(prev => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted at step:', currentStep)
    
    // Only submit if we're on the final step
    if (currentStep !== 11) {
      console.log('Not on final step, preventing submit')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Prepare model details data
      const modelDetailsData = {
        model_id: user.id,
        showname: formData.showname || null,
        slogan: formData.slogan || null,
        gender: formData.gender || null,
        ethnicity: formData.ethnicity || null,
        nationality: formData.nationality || null,
        age: formData.age ? parseInt(formData.age) : null,
        hair_color: formData.hair_color || null,
        eye_color: formData.eye_color || null,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        dress_size: formData.dress_size || null,
        bust_cm: formData.bust_cm ? parseInt(formData.bust_cm) : null,
        waist_cm: formData.waist_cm ? parseInt(formData.waist_cm) : null,
        hip_cm: formData.hip_cm ? parseInt(formData.hip_cm) : null,
        pubic_hair: formData.pubic_hair || null,
        smoking: formData.smoking || null,
        drinking: formData.drinking || null,
        special_characteristics: formData.special_characteristics || null,
        about_me: formData.about_me || null,
        city: formData.city || null,
        incall_options: formData.incall_options.length > 0 ? formData.incall_options : null,
        outcall_options: formData.outcall_options.length > 0 ? formData.outcall_options : null,
        sexual_orientation: formData.sexual_orientation || null,
        services_for: formData.services_for.length > 0 ? formData.services_for : null,
      }

      // Insert or update model details (UPSERT)
      const { error: detailsError } = await supabase
        .from('model_details')
        .upsert(modelDetailsData, { onConflict: 'model_id' })

      if (detailsError) throw detailsError

      // Insert languages
      const languagesToInsert = []
      
      // If user selected a simple language (without clicking Add More)
      if (primaryLanguage && !showAdvancedLanguages) {
        languagesToInsert.push({
          model_id: user.id,
          language: primaryLanguage,
          level: 'good', // Default level when not specified
        })
      }
      
      // Add languages from the advanced list (with levels)
      if (showAdvancedLanguages && languages.length > 0) {
        languages.forEach(lang => {
          languagesToInsert.push({
            model_id: user.id,
            language: lang.language,
            level: lang.level,
          })
        })
      }

      // Delete old languages first
      await supabase.from('model_languages').delete().eq('model_id', user.id)
      
      if (languagesToInsert.length > 0) {
        const { error: languagesError } = await supabase
          .from('model_languages')
          .insert(languagesToInsert)

        if (languagesError) throw languagesError
      }

      // Delete old services first
      await supabase.from('model_services').delete().eq('model_id', user.id)
      
      // Insert selected services
      if (selectedServices.length > 0) {
        const servicesToInsert = selectedServices.map(serviceId => ({
          model_id: user.id,
          service_id: serviceId,
        }))

        const { error: servicesError } = await supabase
          .from('model_services')
          .insert(servicesToInsert)

        if (servicesError) throw servicesError
      }

      // Insert working hours
      const workingHoursToInsert = []
      
      if (scheduleType === '24_7') {
        // 24/7 - all days, all hours
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        days.forEach(day => {
          workingHoursToInsert.push({
            model_id: user.id,
            day_of_week: day,
            start_time: '00:00',
            end_time: '23:59',
          })
        })
      } else if (scheduleType === 'same_every_day') {
        // Same hours every day
        if (sameEveryDayHours.from && sameEveryDayHours.to) {
          const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          days.forEach(day => {
            workingHoursToInsert.push({
              model_id: user.id,
              day_of_week: day,
              start_time: sameEveryDayHours.from,
              end_time: sameEveryDayHours.to,
            })
          })
        }
      } else if (scheduleType === 'custom') {
        // Custom schedule
        Object.entries(customHours).forEach(([day, hours]) => {
          if (hours.from && hours.to) {
            workingHoursToInsert.push({
              model_id: user.id,
              day_of_week: day,
              start_time: hours.from,
              end_time: hours.to,
            })
          }
        })
      }

      // Delete old working hours first
      await supabase.from('model_working_hours').delete().eq('model_id', user.id)
      
      if (workingHoursToInsert.length > 0) {
        const { error: workingHoursError } = await supabase
          .from('model_working_hours')
          .insert(workingHoursToInsert)

        if (workingHoursError) throw workingHoursError
      }

      // Insert rates
      const ratesToInsert = []
      
      // Add incall rates
      incallRates.forEach(rate => {
        const rateData: any = {
          model_id: user.id,
          rate_type: 'incall',
          duration: rate.duration,
          amount: parseFloat(rate.amount),
          currency: 'CHF',
        }
        
        // Add custom time fields for specific_time
        if (rate.duration === 'specific_time' && rate.customTime && rate.customUnit) {
          rateData.custom_time_value = parseInt(rate.customTime)
          rateData.custom_time_unit = rate.customUnit
        }
        
        ratesToInsert.push(rateData)
      })
      
      // Add outcall rates
      outcallRates.forEach(rate => {
        const rateData: any = {
          model_id: user.id,
          rate_type: 'outcall',
          duration: rate.duration,
          amount: parseFloat(rate.amount),
          currency: 'CHF',
        }
        
        // Add custom time fields for specific_time
        if (rate.duration === 'specific_time' && rate.customTime && rate.customUnit) {
          rateData.custom_time_value = parseInt(rate.customTime)
          rateData.custom_time_unit = rate.customUnit
        }
        
        ratesToInsert.push(rateData)
      })

      // Delete old rates first
      await supabase.from('model_rates').delete().eq('model_id', user.id)
      
      if (ratesToInsert.length > 0) {
        const { error: ratesError } = await supabase
          .from('model_rates')
          .insert(ratesToInsert)

        if (ratesError) throw ratesError
      }

      // Insert contact details
      const contactDetailsData = {
        model_id: user.id,
        show_phone_number: showPhoneNumber,
        country_code: countryCode,
        phone_number: phoneNumber || null,
        has_viber: hasViber,
        has_whatsapp: hasWhatsApp,
        has_telegram: hasTelegram,
        contact_instruction: contactInstruction,
        no_withheld_numbers: noWithheldNumbers,
        other_instructions: otherInstructions || null,
      }

      const { error: contactDetailsError } = await supabase
        .from('model_contact_details')
        .upsert(contactDetailsData, { onConflict: 'model_id' })

      if (contactDetailsError) throw contactDetailsError

      // Mark onboarding as completed
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      router.push('/dashboard/model')
      router.refresh()
    } catch (err: any) {
      console.error('Error saving model details:', err)
      setError(err.message || 'Failed to save details')
    } finally {
      setLoading(false)
    }
  }

  const totalSteps = 11

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-pink-600 to-rose-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg mb-6">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* STEP 1: Basic BIO */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Basic BIO</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Showname */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Showname <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.showname}
                  onChange={(e) => handleChange('showname', e.target.value)}
                  placeholder="Name which will appear on your profile"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Gender <span className="text-pink-600">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="trans">Trans</option>
                </select>
              </div>
            </div>

            {/* Slogan */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Slogan
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={(e) => handleChange('slogan', e.target.value)}
                placeholder="Put here a slogan or keyword which describes you and/or your service the best"
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ethnicity */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Ethnicity
                </label>
                <select
                  value={formData.ethnicity}
                  onChange={(e) => handleChange('ethnicity', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">Select ethnicity</option>
                  <option value="asian">Asian</option>
                  <option value="black">Black</option>
                  <option value="caucasian_white">Caucasian (white)</option>
                  <option value="latin">Latin</option>
                  <option value="mixed">Mixed</option>
                  <option value="indian">Indian</option>
                  <option value="arab">Arab</option>
                  <option value="caucasian">Caucasian</option>
                </select>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Nationality
                </label>
                <select
                  value={formData.nationality}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">Select nationality</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  placeholder="Age"
                  min="18"
                  max="100"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Physical Features */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Physical Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hair Color */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Hair Color
                </label>
                <select
                  value={formData.hair_color}
                  onChange={(e) => handleChange('hair_color', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">Select hair color</option>
                  <option value="blond">Blond</option>
                  <option value="light_brown">Light brown</option>
                  <option value="brunette">Brunette</option>
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Eye Color */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Eye Color
                </label>
                <select
                  value={formData.eye_color}
                  onChange={(e) => handleChange('eye_color', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">Select eye color</option>
                  <option value="black">Black</option>
                  <option value="brown">Brown</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Height */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => handleChange('height_cm', e.target.value)}
                  placeholder="cm"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => handleChange('weight_kg', e.target.value)}
                  placeholder="kg"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Dress Size */}
              <div className="col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Dress Size
                </label>
                <select
                  value={formData.dress_size}
                  onChange={(e) => handleChange('dress_size', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">Select size</option>
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
                  Bust (cm)
                </label>
                <input
                  type="number"
                  value={formData.bust_cm}
                  onChange={(e) => handleChange('bust_cm', e.target.value)}
                  placeholder="cm"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Waist */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Waist (cm)
                </label>
                <input
                  type="number"
                  value={formData.waist_cm}
                  onChange={(e) => handleChange('waist_cm', e.target.value)}
                  placeholder="cm"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>

              {/* Hip */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Hip (cm)
                </label>
                <input
                  type="number"
                  value={formData.hip_cm}
                  onChange={(e) => handleChange('hip_cm', e.target.value)}
                  placeholder="cm"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                />
              </div>
            </div>

            {/* Pubic Hair */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Pubic Hair
              </label>
              <select
                value={formData.pubic_hair}
                onChange={(e) => handleChange('pubic_hair', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
              >
                <option value="">Select option</option>
                <option value="shaved_completely">Shaved completely</option>
                <option value="shaved_mostly">Shaved mostly</option>
                <option value="trimmed">Trimmed</option>
                <option value="all_natural">All natural</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: Additional Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Smoking */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Smoking
                </label>
                <select
                  value={formData.smoking}
                  onChange={(e) => handleChange('smoking', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="occasionally">Occasionally</option>
                </select>
              </div>

              {/* Drinking */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Drinking
                </label>
                <select
                  value={formData.drinking}
                  onChange={(e) => handleChange('drinking', e.target.value)}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="occasionally">Occasionally</option>
                </select>
              </div>
            </div>

            {/* Special Characteristics */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Special Characteristics
              </label>
              <textarea
                value={formData.special_characteristics}
                onChange={(e) => handleChange('special_characteristics', e.target.value)}
                placeholder="Please mention any special characteristics e.g. tattoos, piercings, etc."
                rows={4}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: About Me */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
            <p className="text-sm text-gray-600 mb-4">
              Describe yourself and write some additional information (optional)
            </p>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Describe yourself
              </label>
              <textarea
                value={formData.about_me}
                onChange={(e) => handleChange('about_me', e.target.value)}
                placeholder="Tell us about yourself, your personality, what makes you special..."
                rows={8}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 resize-none"
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.about_me.length} / 25000 characters
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Languages */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Languages</h2>
            <p className="text-sm text-gray-600 mb-4">
              Select the language you speak
            </p>
            
            {!showAdvancedLanguages ? (
              /* Simple mode - just one primary language */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  >
                    <option value="">Select language</option>
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddMore}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add More
                </button>
              </div>
            ) : (
              /* Advanced mode - multiple languages with levels */
              <div className="space-y-6">
                <p className="text-sm text-gray-500 italic">
                  You can add up to 5 languages total
                </p>

                {/* Languages List with Level Selection */}
                <div className="space-y-4">
                  {languages.map((lang, index) => (
                    <div key={`${lang.language}-${index}`} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-gray-900">{lang.language}</span>
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
                          Level
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: 'basic', label: 'Basic' },
                            { value: 'fair', label: 'Fair' },
                            { value: 'good', label: 'Good' },
                            { value: 'excellent_native', label: 'Excellent' }
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
                      Maximum 5 languages reached
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Area / Address</h2>
            
            {/* City */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                City
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
              >
                <option value="">Select city...</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* Incall Options */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Incall
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Private apartment',
                  'Hotel room',
                  'Club/Studio',
                  'Other',
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayOption('incall_options', option)}
                    className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
                      formData.incall_options.includes(option)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Outcall Options */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Outcall
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Hotel visits only',
                  'Home visits only',
                  'Hotel and Home visits',
                  'Other',
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleArrayOption('outcall_options', option)}
                    className={`py-2 px-4 text-sm font-semibold rounded-lg transition-all ${
                      formData.outcall_options.includes(option)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Services */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Services</h2>
            
            {/* Sexual Orientation */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Sexual Orientation
              </label>
              <select
                value={formData.sexual_orientation}
                onChange={(e) => handleChange('sexual_orientation', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
              >
                <option value="">Sexual Orientation</option>
                <option value="heterosexual">Heterosexual</option>
                <option value="bisexual">Bisexual</option>
                <option value="homosexual">Homosexual</option>
              </select>
            </div>

            {/* Services Offered For */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Services Offered For
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { value: 'men', label: 'Men' },
                  { value: 'women', label: 'Women' },
                  { value: 'couples', label: 'Couples' },
                  { value: 'trans', label: 'Trans' },
                  { value: 'gays', label: 'Gays' },
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
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Services Categories */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Services</h3>
              
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
                  {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 8: Working Hours */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Working Hours</h2>
            
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
                I am available 24/7
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
                onClick={() => setScheduleType('custom')}
                className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all ${
                  scheduleType === 'custom'
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Custom Schedule
              </button>
            </div>

            {/* Custom Schedule */}
            {scheduleType === 'custom' && (
              <div className="space-y-4">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-bold text-gray-700 capitalize">
                      {day}
                    </label>
                    <div>
                      <input
                        type="time"
                        value={customHours[day as keyof typeof customHours].from}
                        onChange={(e) => updateCustomHours(day, 'from', e.target.value)}
                        placeholder="From"
                        className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50 cursor-pointer"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        value={customHours[day as keyof typeof customHours].to}
                        onChange={(e) => updateCustomHours(day, 'to', e.target.value)}
                        placeholder="To"
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
                    From
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
                    To
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
                  ✓ You will be shown as available 24/7
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 9: Rates */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rates</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Incall Rates */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Incall Rates</h3>
                
                {/* Add Incall Rate Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Duration <span className="text-red-500">*</span>
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
                          placeholder="Enter time"
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
                        <option value="minutes">minutes</option>
                        <option value="hours">hours</option>
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
                    <span className="text-sm font-semibold text-gray-700 px-3 py-3">CHF</span>
                    <button
                      type="button"
                      onClick={addIncallRate}
                      className="px-6 py-3 text-sm font-bold text-pink-600 border-2 border-pink-600 rounded-lg hover:bg-pink-50 transition-all"
                    >
                      ADD
                    </button>
                  </div>
                </div>

                {/* Incall Rates List */}
                {incallRates.length === 0 ? (
                  <p className="text-sm text-gray-500 italic mt-4">No rates defined</p>
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
                            {rate.amount} CHF
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeIncallRate(rate.duration, rate.customTime, rate.customUnit)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outcall Rates */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Outcall Rates</h3>
                
                {/* Add Outcall Rate Form */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Duration <span className="text-red-500">*</span>
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
                          placeholder="Enter time"
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
                        <option value="minutes">minutes</option>
                        <option value="hours">hours</option>
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
                    <span className="text-sm font-semibold text-gray-700 px-3 py-3">CHF</span>
                    <button
                      type="button"
                      onClick={addOutcallRate}
                      className="px-6 py-3 text-sm font-bold text-pink-600 border-2 border-pink-600 rounded-lg hover:bg-pink-50 transition-all"
                    >
                      ADD
                    </button>
                  </div>
                </div>

                {/* Outcall Rates List */}
                {outcallRates.length === 0 ? (
                  <p className="text-sm text-gray-500 italic mt-4">No rates defined</p>
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
                            {rate.amount} CHF
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOutcallRate(rate.duration, rate.customTime, rate.customUnit)}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          Remove
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Details</h2>
            
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
                  Show phone number
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Country Code <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
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
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please provide the country calling code if you use a non-Swiss number
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
              <h3 className="text-lg font-bold text-gray-900">Instructions</h3>
              
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
                  SMS and Call
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
                  SMS Only
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
                  No SMS
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
                  No Withheld Numbers
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Other
                </label>
                <textarea
                  value={otherInstructions}
                  onChange={(e) => setOtherInstructions(e.target.value)}
                  placeholder="Additional instructions..."
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pictures / Video</h2>
            
            {/* Photos Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Requirements</h3>
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

            {/* Video Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Video</h3>
                <p className="text-sm text-gray-700 mb-2">
                  Showing a video in your sedcard makes you unique and spices your profile up! 
                  Even a short and simple video taken by smartphone will raise the number of 
                  visitors on your profile.
                </p>
                <h4 className="text-sm font-bold text-gray-900 mb-1">Requirements</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Video Max size is 200mb</li>
                  <li>Allowed video formats: MP4, MOV, WMV, FLV, AVI, MKV</li>
                  <li>Explicit nudity is not allowed</li>
                  <li>Min video height is 360px</li>
                </ul>
              </div>

              <div>
                <label htmlFor="video-upload" className="block">
                  <div className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg text-center cursor-pointer inline-block">
                    {uploadingVideos ? 'UPLOADING...' : 'UPLOAD VIDEOS'}
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
                <p className="text-sm text-gray-500 italic">No videos uploaded</p>
              ) : (
                <div className="space-y-3">
                  {uploadedVideos.map((video) => (
                    <div key={video.id} className="flex items-center justify-between bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{video.file_name}</p>
                        <p className="text-xs text-gray-500">Pending verification</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteVideo(video.id, video.file_path)}
                        className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
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
                <span className="font-semibold">Note:</span> All uploaded photos and videos will be reviewed 
                by our admin team before being published on your profile. You will be notified once they are approved.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              Back
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
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'FINISH'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
