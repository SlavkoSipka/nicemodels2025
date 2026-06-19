'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Save, CheckCircle, AlertCircle, User, MapPin, Phone,
  Sparkles, Clock, Languages, ChevronDown, ChevronUp, Trash2, Plus,
  ShieldCheck, Ban, ImageIcon, Film, DollarSign, Zap,
} from 'lucide-react'
import AdminMessageButton from '@/components/admin/AdminMessageButton'
import PhoneInput from '@/components/ui/PhoneInput'
import CitySearch from '@/components/ui/CitySearch'
import { MODEL_ETHNICITY_SLUGS } from '@/lib/modelEthnicitySlugs'

interface Props {
  modelId: string
  profile: any
  modelDetails: any
  photos: any[]
  videos: any[]
  contactDetails: any
  languages: any[]
  modelServices: number[]
  allServices: any[]
  workingHours: any[]
  rates: any[]
  adPackages: any[]
  currentAdExpiry: string | null
}

const AVAILABLE_LANGUAGES = [
  'English', 'German', 'French', 'Italian', 'Spanish', 'Portuguese',
  'Russian', 'Polish', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
  'Czech', 'Romanian', 'Greek', 'Hungarian', 'Croatian', 'Serbian',
  'Bulgarian', 'Ukrainian', 'Albanian', 'Slovak', 'Slovenian',
  'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Malay',
  'Arabic', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Other',
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

type DayHours = { from: string; to: string }

function starToLevel(s: number) {
  if (s <= 2) return 'basic'
  if (s === 3) return 'fair'
  if (s === 4) return 'good'
  return 'excellent_native'
}
function levelToStars(l: string) {
  if (l === 'basic') return 2; if (l === 'fair') return 3; if (l === 'good') return 4; return 5
}

export default function AdminModelEditClient({
  modelId, profile, modelDetails, photos, videos,
  contactDetails, languages: initLangs, modelServices: initServices,
  allServices, workingHours: initWH, rates,
  adPackages, currentAdExpiry,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('admin.modelEdit')
  const tc = useTranslations('admin.common')
  const ethn = useTranslations('onboarding.model.eth')
  const ts2 = useTranslations('onboarding.model.s2')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('bio')

  // ── Sedcard admin activation ──
  const [adPackageId, setAdPackageId] = useState<string>(adPackages[0]?.id || '')
  const [activatingSedcard, setActivatingSedcard] = useState(false)
  const [sedcardMsg, setSedcardMsg] = useState('')
  const [sedcardErr, setSedcardErr] = useState('')

  const activateSedcard = async () => {
    if (!adPackageId) return
    setActivatingSedcard(true); setSedcardMsg(''); setSedcardErr('')
    try {
      const res = await fetch('/api/admin/activate-sedcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, productId: adPackageId }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || t('sedcardFailed'))
      setSedcardMsg(t('sedcardActivated'))
      router.refresh()
    } catch (e: any) {
      setSedcardErr(e?.message || t('sedcardFailed'))
    } finally {
      setActivatingSedcard(false)
    }
  }

  const norm = (v: string | null | undefined) =>
    v ? v.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '') : ''

  // ── Profile fields ──
  const [profileData, setProfileData] = useState({
    username: profile.username || '',
    email: profile.email || '',
    is_verified: profile.is_verified || false,
    is_blocked: profile.is_blocked || false,
  })

  // ── Biography / model_details ──
  const [bio, setBio] = useState({
    showname: modelDetails?.showname || '',
    slogan: modelDetails?.slogan || '',
    gender: norm(modelDetails?.gender),
    ethnicity: norm(modelDetails?.ethnicity),
    nationality: modelDetails?.nationality || '',
    age: modelDetails?.age?.toString() || '',
    hair_color: norm(modelDetails?.hair_color),
    eye_color: norm(modelDetails?.eye_color),
    height_cm: modelDetails?.height_cm?.toString() || '',
    weight_kg: modelDetails?.weight_kg?.toString() || '',
    dress_size: norm(modelDetails?.dress_size),
    bust_cm: modelDetails?.bust_cm?.toString() || '',
    waist_cm: modelDetails?.waist_cm?.toString() || '',
    hip_cm: modelDetails?.hip_cm?.toString() || '',
    pubic_hair: norm(modelDetails?.pubic_hair),
    smoking: norm(modelDetails?.smoking),
    drinking: norm(modelDetails?.drinking),
    special_characteristics: modelDetails?.special_characteristics || '',
    about_me: modelDetails?.about_me || '',
  })

  // ── Area ──
  const [city, setCity] = useState(modelDetails?.city || '')
  const [zipCode, setZipCode] = useState(modelDetails?.zip_code || '')
  const [addrStreet, setAddrStreet] = useState(modelDetails?.street || '')
  const [streetNumber, setStreetNumber] = useState(modelDetails?.street_number || '')
  const [incallOptions, setIncallOptions] = useState<string[]>(modelDetails?.incall_options || [])
  const [outcallOptions, setOutcallOptions] = useState<string[]>(modelDetails?.outcall_options || [])

  // ── Contact ──
  const [contact, setContact] = useState({
    show_phone_number: contactDetails?.show_phone_number || false,
    country_code: contactDetails?.country_code || '+41',
    phone_number: contactDetails?.phone_number || '',
    has_viber: contactDetails?.has_viber || false,
    has_whatsapp: contactDetails?.has_whatsapp || false,
    has_telegram: contactDetails?.has_telegram || false,
    contact_instruction: contactDetails?.contact_instruction || 'sms_and_call',
    no_withheld_numbers: contactDetails?.no_withheld_numbers || false,
    other_instructions: contactDetails?.other_instructions || '',
  })

  // ── Languages ──
  const [langs, setLangs] = useState(
    initLangs.length > 0
      ? initLangs.map((l: any) => ({ language: l.language, stars: levelToStars(l.level) }))
      : [{ language: '', stars: 5 }]
  )

  // ── Services ──
  const [sexualOrientation, setSexualOrientation] = useState(modelDetails?.sexual_orientation || '')
  const [servicesFor, setServicesFor] = useState<string[]>(modelDetails?.services_for || [])
  const [selectedServices, setSelectedServices] = useState<number[]>(initServices)
  const [otherServices, setOtherServices] = useState(modelDetails?.other_services || '')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // ── Working hours ──
  const initIs247 = initWH.length === 7 && initWH.every((h: any) => h.start_time === '00:00:00' && h.end_time === '23:59:00')
  const initAllSame = !initIs247 && initWH.length === 7 && initWH.every((h: any) => h.start_time === initWH[0]?.start_time && h.end_time === initWH[0]?.end_time)
  const [scheduleType, setScheduleType] = useState<'24_7' | 'same_every_day' | 'custom'>(
    initIs247 ? '24_7' : initAllSame ? 'same_every_day' : initWH.length > 0 ? 'custom' : '24_7'
  )
  const [sameHours, setSameHours] = useState<DayHours>(
    initAllSame ? { from: initWH[0]?.start_time?.slice(0, 5) || '', to: initWH[0]?.end_time?.slice(0, 5) || '' } : { from: '', to: '' }
  )
  const [customHours, setCustomHours] = useState<Record<string, DayHours>>(() => {
    const base: Record<string, DayHours> = {}
    DAYS.forEach(d => { base[d] = { from: '', to: '' } })
    if (!initIs247 && !initAllSame) {
      initWH.forEach((h: any) => { base[h.day_of_week] = { from: h.start_time?.slice(0, 5) || '', to: h.end_time?.slice(0, 5) || '' } })
    }
    return base
  })

  // ── Helpers ──
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent'
  const labelCls = 'block text-xs font-bold text-gray-800 mb-1'
  const toggleBtn = (active: boolean) =>
    `px-3 py-2 text-sm rounded-lg border transition-colors font-medium cursor-pointer ${
      active ? 'border-brand bg-brand/10 text-brand' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
    }`
  const tabBtn = (id: string) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      activeTab === id ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`
  const toggle = (arr: string[], setArr: (v: string[]) => void, opt: string) =>
    setArr(arr.includes(opt) ? arr.filter(o => o !== opt) : [...arr, opt])

  const starLabel = (s: number) => {
    if (s <= 2) return t('starBasic'); if (s === 3) return t('starFair'); if (s === 4) return t('starGood'); return t('starExcellent')
  }

  const getServicesByCategory = (cat: string) => allServices.filter((s: any) => s.category === cat)
  const getSelectedCount = (cat: string) => getServicesByCategory(cat).filter((s: any) => selectedServices.includes(s.id)).length
  const getCategoryLabel = (cat: string) => ({
    main: t('categoryMain'), extra: t('categoryExtra'),
    fetish_bizarre: t('categoryFetish'), virtual: t('categoryVirtual'),
    massage: t('categoryMassage'),
  }[cat] || cat)

  // ── Save All ──
  const handleSave = async () => {
    setError(''); setSuccess('')
    if (!bio.showname) { setError(t('shownameRequired')); return }
    setSaving(true)

    try {
      const validLangs = langs.filter((l: any) => l.language)
      const whRows: any[] = []
      if (scheduleType === '24_7') {
        DAYS.forEach(d => whRows.push({ model_id: modelId, day_of_week: d, start_time: '00:00', end_time: '23:59' }))
      } else if (scheduleType === 'same_every_day' && sameHours.from && sameHours.to) {
        DAYS.forEach(d => whRows.push({ model_id: modelId, day_of_week: d, start_time: sameHours.from, end_time: sameHours.to }))
      } else if (scheduleType === 'custom') {
        DAYS.forEach(d => { if (customHours[d].from && customHours[d].to) whRows.push({ model_id: modelId, day_of_week: d, start_time: customHours[d].from, end_time: customHours[d].to }) })
      }

      const operations: any[] = [
        {
          action: 'update', table: 'profiles',
          data: {
            username: profileData.username,
            is_verified: profileData.is_verified,
            is_blocked: profileData.is_blocked,
            blocked_at: profileData.is_blocked ? new Date().toISOString() : null,
          },
          match: { id: modelId },
        },
        {
          action: 'upsert', table: 'model_details', onConflict: 'model_id',
          data: {
            model_id: modelId,
            showname: bio.showname,
            slogan: bio.slogan || null,
            gender: bio.gender || null,
            ethnicity: bio.ethnicity || null,
            nationality: bio.nationality || null,
            age: bio.age ? parseInt(bio.age) : null,
            hair_color: bio.hair_color || null,
            eye_color: bio.eye_color || null,
            height_cm: bio.height_cm ? parseInt(bio.height_cm) : null,
            weight_kg: bio.weight_kg ? parseFloat(bio.weight_kg) : null,
            dress_size: bio.dress_size || null,
            bust_cm: bio.bust_cm ? parseInt(bio.bust_cm) : null,
            waist_cm: bio.waist_cm ? parseInt(bio.waist_cm) : null,
            hip_cm: bio.hip_cm ? parseInt(bio.hip_cm) : null,
            pubic_hair: bio.pubic_hair || null,
            smoking: bio.smoking || null,
            drinking: bio.drinking || null,
            special_characteristics: bio.special_characteristics || null,
            about_me: bio.about_me || null,
            city: city || null,
            zip_code: zipCode || null,
            street: addrStreet || null,
            street_number: streetNumber || null,
            incall_options: incallOptions.length > 0 ? incallOptions : null,
            outcall_options: outcallOptions.length > 0 ? outcallOptions : null,
            sexual_orientation: sexualOrientation || null,
            services_for: servicesFor.length > 0 ? servicesFor : null,
            other_services: (() => {
              const t = (otherServices || '').trim()
              return t.length > 0 ? t.slice(0, 2000) : null
            })(),
          },
        },
        {
          action: 'upsert', table: 'model_contact_details', onConflict: 'model_id',
          data: {
            model_id: modelId,
            show_phone_number: contact.show_phone_number,
            country_code: contact.country_code,
            phone_number: contact.phone_number,
            has_viber: contact.has_viber,
            has_whatsapp: contact.has_whatsapp,
            has_telegram: contact.has_telegram,
            contact_instruction: contact.contact_instruction,
            no_withheld_numbers: contact.no_withheld_numbers,
            other_instructions: contact.other_instructions,
            updated_at: new Date().toISOString(),
          },
        },
        { action: 'delete', table: 'model_languages', match: { model_id: modelId } },
        { action: 'delete', table: 'model_services', match: { model_id: modelId } },
        { action: 'delete', table: 'model_working_hours', match: { model_id: modelId } },
      ]

      if (validLangs.length > 0) {
        operations.push({
          action: 'insert', table: 'model_languages',
          data: validLangs.map((l: any) => ({ model_id: modelId, language: l.language, level: starToLevel(l.stars) })),
        })
      }
      if (selectedServices.length > 0) {
        operations.push({
          action: 'insert', table: 'model_services',
          data: selectedServices.map(id => ({ model_id: modelId, service_id: id })),
        })
      }
      if (whRows.length > 0) {
        operations.push({ action: 'insert', table: 'model_working_hours', data: whRows })
      }

      const res = await fetch('/api/admin/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations,
          notify: {
            userId: modelId,
            title: t('notifyTitle'),
            message: t('notifyMessage'),
            actionUrl: '/dashboard/model/profile',
            relatedEntityType: 'profile',
            relatedEntityId: modelId,
          },
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || tc('failedToSave'))
      }

      setSuccess(tc('savedSuccess'))
      setTimeout(() => setSuccess(''), 4000)
    } catch (e: any) {
      setError(e?.message || tc('failedToSaveTry'))
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = (d: string) => ({
    '30_minutes': t('rateDuration30'), '1_hour': t('rateDuration1'), '2_hours': t('rateDuration2'),
    'additional_hour': t('rateDurationAdd'), 'overnight': t('rateDurationOvernight'),
    'dinner_date': t('rateDurationDinner'), 'weekend': t('rateDurationWeekend'), 'specific_time': t('rateDurationSpecific'),
  }[d] || d)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <Link href="/dashboard/admin/models" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
              <ArrowLeft className="w-3 h-3" /> {t('back')}
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-brand" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                    {modelDetails?.showname || profile.username}
                    {profile.public_id && <span className="ml-2 text-xs font-mono text-gray-400">#{profile.public_id}</span>}
                  </h1>
                  <a href={`mailto:${profile.email}`} className="text-xs text-gray-500 hover:text-brand hover:underline break-all">{profile.email}</a>
                </div>
                {profileData.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    <ShieldCheck className="w-3 h-3" /> {tc('verified')}
                  </span>
                )}
                {profileData.is_blocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                    <Ban className="w-3 h-3" /> {tc('blocked')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <AdminMessageButton
                  userId={modelId}
                  recipientEmail={profile.email}
                  recipientName={modelDetails?.showname || profile.username}
                  defaultSubject={t('messageSubject')}
                />
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 disabled:opacity-50 transition-colors">
                  <Save className="w-4 h-4" />
                  {saving ? tc('savingDots') : <><span className="hidden sm:inline">{tc('saveAll')}</span><span className="sm:hidden">{tc('save')}</span></>}
                </button>
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

          {/* Tabs — horizontally scrollable on mobile, sticky under header */}
          <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 sm:pb-0 sticky top-12 md:top-0 z-20 bg-gray-50 py-2 -my-2">
            {[
              { id: 'bio', label: t('tabBio'), icon: User },
              { id: 'area', label: t('tabArea'), icon: MapPin },
              { id: 'contact', label: t('tabContact'), icon: Phone },
              { id: 'languages', label: t('tabLanguages'), icon: Languages },
              { id: 'services', label: t('tabServices'), icon: Sparkles },
              { id: 'hours', label: t('tabHours'), icon: Clock },
              { id: 'media', label: t('tabMedia'), icon: ImageIcon },
              { id: 'rates', label: t('tabRates'), icon: DollarSign },
              { id: 'account', label: t('tabAccount'), icon: ShieldCheck },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`${tabBtn(tab.id)} flex items-center gap-1.5 shrink-0`}>
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {/* ════════ BIOGRAPHY ════════ */}
          {activeTab === 'bio' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
                <p className="text-sm font-bold text-gray-800 mb-3">{t('basicInfo')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{t('showname')} <span className="text-red-500">*</span></label>
                    <input value={bio.showname} onChange={e => setBio(p => ({ ...p, showname: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('slogan')}</label>
                    <input value={bio.slogan} onChange={e => setBio(p => ({ ...p, slogan: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('gender')}</label>
                    <select value={bio.gender} onChange={e => setBio(p => ({ ...p, gender: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      <option value="female">{t('genderFemale')}</option>
                      <option value="male">{t('genderMale')}</option>
                      <option value="trans">{t('genderTrans')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('ethnicity')}</label>
                    <select value={bio.ethnicity} onChange={e => setBio(p => ({ ...p, ethnicity: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      {MODEL_ETHNICITY_SLUGS.map(v => (
                        <option key={v} value={v}>{ethn(v)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('nationality')}</label>
                    <select value={bio.nationality} onChange={e => setBio(p => ({ ...p, nationality: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      {['Switzerland','Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Belarus','Belgium','Bosnia and Herzegovina','Brazil','Bulgaria','Canada','Chile','China','Colombia','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Egypt','Estonia','Finland','France','Georgia','Germany','Greece','Hungary','India','Indonesia','Iran','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan','Korea','Latvia','Lebanon','Lithuania','Luxembourg','Malaysia','Mexico','Moldova','Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Philippines','Poland','Portugal','Romania','Russia','Saudi Arabia','Serbia','Slovakia','Slovenia','South Africa','Spain','Sweden','Turkey','Ukraine','United Arab Emirates','United Kingdom','United States','Venezuela','Vietnam','Other'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('age')}</label>
                    <input type="number" min="18" max="99" value={bio.age} onChange={e => setBio(p => ({ ...p, age: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
                <p className="text-sm font-bold text-gray-800 mb-3">{t('physicalFeatures')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{t('hairColor')}</label>
                    <select value={bio.hair_color} onChange={e => setBio(p => ({ ...p, hair_color: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      {([
                        ['blond','hairBlond'],
                        ['light_brown','hairLightBrown'],
                        ['brunette','hairBrunette'],
                        ['black','hairBlack'],
                        ['red','hairRed'],
                        ['other','hairOther'],
                      ] as const).map(([v, k]) => (
                        <option key={v} value={v}>{ts2(k)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('eyeColor')}</label>
                    <select value={bio.eye_color} onChange={e => setBio(p => ({ ...p, eye_color: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      {([
                        ['black','eyeBlack'],
                        ['brown','eyeBrown'],
                        ['green','eyeGreen'],
                        ['blue','eyeBlue'],
                        ['gray','eyeGray'],
                        ['hazel','eyeHazel'],
                      ] as const).map(([v, k]) => (
                        <option key={v} value={v}>{ts2(k)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('dressSize')}</label>
                    <select value={bio.dress_size} onChange={e => setBio(p => ({ ...p, dress_size: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      {['xs','s','m','l','xl','xxl'].map(v => (
                        <option key={v} value={v}>{v.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  {(['height_cm', 'weight_kg', 'bust_cm', 'waist_cm', 'hip_cm'] as const).map(f => {
                    const labelKey = ({ height_cm: 'heightCm', weight_kg: 'weightKg', bust_cm: 'bustCm', waist_cm: 'waistCm', hip_cm: 'hipCm' } as const)[f]
                    return (
                      <div key={f}>
                        <label className={labelCls}>{t(labelKey)}</label>
                        <input type="number" value={(bio as any)[f]} onChange={e => setBio(p => ({ ...p, [f]: e.target.value }))} className={inputCls} />
                      </div>
                    )
                  })}
                  <div>
                    <label className={labelCls}>{t('pubicHair')}</label>
                    <select value={bio.pubic_hair} onChange={e => setBio(p => ({ ...p, pubic_hair: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      {([
                        ['shaved_completely','pubicShavedFull'],
                        ['shaved_mostly','pubicShavedMost'],
                        ['trimmed','pubicTrimmed'],
                        ['all_natural','pubicNatural'],
                      ] as const).map(([v, k]) => (
                        <option key={v} value={v}>{ts2(k)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
                <p className="text-sm font-bold text-gray-800 mb-3">{t('additional')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>{t('smoking')}</label>
                    <select value={bio.smoking} onChange={e => setBio(p => ({ ...p, smoking: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      <option value="yes">{tc('yes')}</option><option value="no">{tc('no')}</option><option value="occasionally">{t('occasionally')}</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>{t('drinking')}</label>
                    <select value={bio.drinking} onChange={e => setBio(p => ({ ...p, drinking: e.target.value }))} className={inputCls}>
                      <option value="">{tc('select')}</option>
                      <option value="yes">{tc('yes')}</option><option value="no">{tc('no')}</option><option value="occasionally">{t('occasionally')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('specialCharacteristics')}</label>
                  <textarea value={bio.special_characteristics} onChange={e => setBio(p => ({ ...p, special_characteristics: e.target.value }))}
                    rows={3} className={inputCls + ' resize-none'} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
                <label className={labelCls}>{t('aboutMe')}</label>
                <textarea value={bio.about_me} onChange={e => setBio(p => ({ ...p, about_me: e.target.value }))}
                  rows={6} className={inputCls + ' resize-y font-mono text-xs'} />
              </div>
            </div>
          )}

          {/* ════════ AREA ════════ */}
          {activeTab === 'area' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4 sm:space-y-5">
              <div>
                <label className={labelCls}>{t('city')}</label>
                <CitySearch
                  value={city}
                  postalCode={zipCode}
                  onChange={(c) => {
                    setCity(c?.name || '')
                    if (c?.postal_code) setZipCode(c.postal_code)
                  }}
                  placeholder={t('cityPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>{t('plz')}</label>
                  <input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="8001" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('street')}</label>
                  <input value={addrStreet} onChange={e => setAddrStreet(e.target.value)} placeholder="Bahnhofstrasse" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('streetNumber')}</label>
                  <input value={streetNumber} onChange={e => setStreetNumber(e.target.value)} placeholder="12a" className={inputCls} />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 mb-2">{t('incall')}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'Private apartment', label: t('incallPrivate') },
                    { value: 'Hotel room', label: t('incallHotel') },
                    { value: 'Club/Studio', label: t('incallClub') },
                    { value: 'Other', label: t('incallOther') },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => toggle(incallOptions, setIncallOptions, opt.value)}
                      className={toggleBtn(incallOptions.includes(opt.value))}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 mb-2">{t('outcall')}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'Hotel visits only', label: t('outcallHotelOnly') },
                    { value: 'Home visits only', label: t('outcallHomeOnly') },
                    { value: 'Hotel and Home visits', label: t('outcallBoth') },
                    { value: 'Other', label: t('outcallOther') },
                  ].map(opt => (
                    <button key={opt.value} type="button" onClick={() => toggle(outcallOptions, setOutcallOptions, opt.value)}
                      className={toggleBtn(outcallOptions.includes(opt.value))}>{opt.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ CONTACT ════════ */}
          {activeTab === 'contact' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4 sm:space-y-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={contact.show_phone_number}
                  onChange={e => setContact(p => ({ ...p, show_phone_number: e.target.checked }))}
                  className="w-4 h-4 text-brand rounded" />
                <span className="text-sm font-semibold text-gray-900">{t('showPhoneNumber')}</span>
              </label>
              <div>
                <label className={labelCls}>{t('phoneNumber')}</label>
                <PhoneInput
                  countryCode={contact.country_code}
                  phoneNumber={contact.phone_number}
                  onCountryCodeChange={v => setContact(p => ({ ...p, country_code: v }))}
                  onPhoneNumberChange={v => setContact(p => ({ ...p, phone_number: v }))}
                />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 mb-2">{t('availableOn')}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'has_viber', label: 'Viber' },
                    { key: 'has_whatsapp', label: 'WhatsApp' },
                    { key: 'has_telegram', label: 'Telegram' },
                  ].map(app => (
                    <button key={app.key} type="button"
                      onClick={() => setContact(p => ({ ...p, [app.key]: !(p as any)[app.key] }))}
                      className={toggleBtn((contact as any)[app.key])}>
                      {(contact as any)[app.key] && '✓ '}{app.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 mb-2">{t('contactPreference')}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'sms_and_call', label: t('smsAndCall') },
                    { value: 'sms_only', label: t('smsOnly') },
                    { value: 'no_sms', label: t('noSms') },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setContact(p => ({ ...p, contact_instruction: opt.value }))}
                      className={toggleBtn(contact.contact_instruction === opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={contact.no_withheld_numbers}
                  onChange={e => setContact(p => ({ ...p, no_withheld_numbers: e.target.checked }))}
                  className="w-4 h-4 text-brand rounded" />
                <span className="text-sm font-semibold text-gray-900">{t('noWithheldNumbers')}</span>
              </label>
              <div>
                <label className={labelCls}>{t('otherInstructions')}</label>
                <textarea value={contact.other_instructions}
                  onChange={e => setContact(p => ({ ...p, other_instructions: e.target.value }))}
                  rows={3} className={inputCls + ' resize-none'} />
              </div>
            </div>
          )}

          {/* ════════ LANGUAGES ════════ */}
          {activeTab === 'languages' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
              <div className="space-y-2.5 mb-4">
                {langs.map((lang: any, i: number) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
                    <select value={lang.language}
                      onChange={e => { const u = [...langs]; u[i] = { ...u[i], language: e.target.value }; setLangs(u) }}
                      className={inputCls + ' flex-1 min-w-[140px]'}>
                      <option value="">{tc('select')}</option>
                      {AVAILABLE_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} type="button"
                          onClick={() => { const u = [...langs]; u[i] = { ...u[i], stars: s }; setLangs(u) }}>
                          <svg className={`w-5 h-5 ${s <= lang.stars ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                      <span className="text-xs text-gray-400 ml-1 w-14">{starLabel(lang.stars)}</span>
                    </div>
                    {langs.length > 1 && (
                      <button onClick={() => setLangs(langs.filter((_: any, idx: number) => idx !== i))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setLangs([...langs, { language: '', stars: 5 }])}
                className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand/80">
                <Plus className="w-4 h-4" /> {t('addLanguage')}
              </button>
            </div>
          )}

          {/* ════════ SERVICES ════════ */}
          {activeTab === 'services' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4 sm:space-y-5">
              <div>
                <label className={labelCls}>{t('sexualOrientation')}</label>
                <select value={sexualOrientation} onChange={e => setSexualOrientation(e.target.value)} className={inputCls}>
                  <option value="">{tc('select')}</option>
                  <option value="heterosexual">{t('heterosexual')}</option>
                  <option value="bisexual">{t('bisexual')}</option>
                  <option value="homosexual">{t('homosexual')}</option>
                </select>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 mb-2">{t('servicesFor')}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'men', label: t('men') },
                    { value: 'women', label: t('women') },
                    { value: 'couples', label: t('couples') },
                    { value: 'trans', label: t('trans') },
                    { value: 'gays', label: t('gays') },
                  ].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => toggle(servicesFor, setServicesFor, opt.value)}
                      className={toggleBtn(servicesFor.includes(opt.value))}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {['main','extra','fetish_bizarre','virtual','massage'].map(cat => {
                  const catSvc = getServicesByCategory(cat)
                  const expanded = expandedCategory === cat
                  return (
                    <div key={cat} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button type="button" onClick={() => setExpandedCategory(expanded ? null : cat)}
                        className="w-full px-4 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand">{getCategoryLabel(cat)}</span>
                          <span className="text-xs text-gray-500">{getSelectedCount(cat)}/{catSvc.length}</span>
                        </div>
                        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </button>
                      {expanded && (
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {catSvc.map((svc: any) => (
                            <label key={svc.id} className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-brand/5 text-sm">
                              <input type="checkbox" checked={selectedServices.includes(svc.id)}
                                onChange={() => setSelectedServices(prev => prev.includes(svc.id) ? prev.filter(x => x !== svc.id) : [...prev, svc.id])}
                                className="w-3.5 h-3.5 text-brand rounded" />
                              {svc.name}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className={labelCls}>{t('otherServices')}</label>
                <p className="text-[11px] text-gray-500 mb-2">{t('otherServicesHint')}</p>
                <textarea
                  value={otherServices}
                  onChange={e => setOtherServices(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className={inputCls + ' resize-y min-h-[96px]'}
                  placeholder={t('freeText')}
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">{(otherServices || '').length}/2000</p>
              </div>
            </div>
          )}

          {/* ════════ WORKING HOURS ════════ */}
          {activeTab === 'hours' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
              <div className="flex gap-2 mb-5 flex-wrap">
                {[
                  { id: '24_7' as const, label: t('available247') },
                  { id: 'same_every_day' as const, label: t('sameEveryDay') },
                  { id: 'custom' as const, label: t('customSchedule') },
                ].map(opt => (
                  <button key={opt.id} type="button" onClick={() => setScheduleType(opt.id)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${scheduleType === opt.id ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {scheduleType === '24_7' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-sm text-emerald-800 font-semibold">{t('available247')}</p>
                </div>
              )}
              {scheduleType === 'same_every_day' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{tc('from')}</label>
                    <input type="time" value={sameHours.from}
                      onChange={e => setSameHours(p => ({ ...p, from: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{tc('to')}</label>
                    <input type="time" value={sameHours.to}
                      onChange={e => setSameHours(p => ({ ...p, to: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              )}
              {scheduleType === 'custom' && (
                <div className="grid sm:grid-cols-2 gap-2">
                  {DAYS.map(day => (
                    <div key={day} className="flex items-center gap-2">
                      <span className="w-8 text-xs font-bold text-gray-700 shrink-0">{DAY_LABELS[day]}</span>
                      <input type="time" value={customHours[day].from}
                        onChange={e => setCustomHours(p => ({ ...p, [day]: { ...p[day], from: e.target.value } }))}
                        className={inputCls + ' flex-1'} />
                      <span className="text-xs text-gray-400">–</span>
                      <input type="time" value={customHours[day].to}
                        onChange={e => setCustomHours(p => ({ ...p, [day]: { ...p[day], to: e.target.value } }))}
                        className={inputCls + ' flex-1'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════ MEDIA (read-only gallery) ════════ */}
          {activeTab === 'media' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand" /> {t('photos', { count: photos.length })}
                </p>
                {photos.length === 0 ? (
                  <p className="text-sm text-gray-400">{t('noPhotos')}</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {photos.map((p: any) => (
                      <div key={p.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                        {p.url && (
                          <Image src={p.url} alt="" fill className="object-cover" sizes="120px" />
                        )}
                        <div className="absolute bottom-1 right-1">
                          {p.is_approved ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">{t('ok')}</span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">{tc('pending')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Film className="w-4 h-4 text-brand" /> {t('videos', { count: videos.length })}
                </p>
                {videos.length === 0 ? (
                  <p className="text-sm text-gray-400">{t('noVideos')}</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {videos.map((v: any) => (
                      <div key={v.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                        {v.url && <video src={v.url} className="w-full h-full object-cover" />}
                        <div className="absolute bottom-1 right-1">
                          {v.is_approved ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">{t('ok')}</span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">{tc('pending')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ RATES (read-only) ════════ */}
          {activeTab === 'rates' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5">
              <p className="text-xs font-bold text-gray-500 mb-3">{t('ratesNote')}</p>
              {rates.length === 0 ? (
                <p className="text-sm text-gray-400">{t('noRates')}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['incall', 'outcall'].map(type => {
                    const filtered = rates.filter((r: any) => r.rate_type === type)
                    const typeLabel = type === 'incall' ? t('incallType') : t('outcallType')
                    return (
                      <div key={type}>
                        <p className="text-xs font-bold uppercase tracking-wider text-brand mb-2">{typeLabel}</p>
                        {filtered.length === 0 ? (
                          <p className="text-xs text-gray-400">—</p>
                        ) : (
                          <div className="space-y-1">
                            {filtered.map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-600">{formatDuration(r.duration)}</span>
                                <span className="text-sm font-bold text-gray-900">{r.amount} {r.currency || 'CHF'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════ ACCOUNT ════════ */}
          {activeTab === 'account' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('username')}</label>
                  <input value={profileData.username} onChange={e => setProfileData(p => ({ ...p, username: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('emailReadOnly')}</label>
                  <input value={profileData.email} disabled className={inputCls + ' bg-gray-50 text-gray-500'} />
                </div>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.is_verified}
                    onChange={e => setProfileData(p => ({ ...p, is_verified: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-semibold text-gray-900">{tc('verified')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.is_blocked}
                    onChange={e => setProfileData(p => ({ ...p, is_blocked: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded" />
                  <span className="text-sm font-semibold text-gray-900">{tc('blocked')}</span>
                </label>
              </div>
              <div className="text-xs text-gray-400 space-y-0.5">
                <p>{t('createdLabel', { date: new Date(profile.created_at).toLocaleString() })}</p>
                <p>{t('onboardingLabel', { state: profile.onboarding_completed ? t('onboardingCompleted') : t('onboardingIncomplete') })}</p>
                {profile.blocked_at && <p>{t('blockedAt', { date: new Date(profile.blocked_at).toLocaleString() })}</p>}
              </div>

              {/* ── Sedcard activation (admin grant) ── */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand" />
                  <p className="text-sm font-bold text-gray-900">{t('sedcardSection')}</p>
                </div>
                {currentAdExpiry ? (
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    {t('sedcardActiveUntil', { date: new Date(currentAdExpiry).toLocaleString() })}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">{t('sedcardNone')}</p>
                )}
                <p className="text-xs text-gray-400">{t('sedcardHint')}</p>
                {adPackages.length === 0 ? (
                  <p className="text-xs text-amber-600">{t('sedcardNoPackages')}</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={adPackageId}
                      onChange={e => setAdPackageId(e.target.value)}
                      className={inputCls + ' sm:w-auto'}
                    >
                      {adPackages.map((p: any) => {
                        const dur = p.duration_days
                          ? t('sedcardDays', { count: p.duration_days })
                          : t('sedcardHours', { count: p.duration_hours })
                        return (
                          <option key={p.id} value={p.id}>{p.name} — {dur}</option>
                        )
                      })}
                    </select>
                    <button
                      onClick={activateSedcard}
                      disabled={activatingSedcard || !adPackageId}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 disabled:opacity-50 transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      {activatingSedcard ? tc('savingDots') : t('activateSedcard')}
                    </button>
                  </div>
                )}
                {sedcardMsg && (
                  <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {sedcardMsg}
                  </p>
                )}
                {sedcardErr && (
                  <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {sedcardErr}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bottom save (desktop only — mobile uses sticky bar below) */}
          <div className="hidden sm:flex items-center justify-end gap-3 pb-6">
            <Link href="/dashboard/admin/models" className="text-sm font-semibold text-gray-600 hover:text-gray-900">{tc('cancel')}</Link>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? tc('savingDots') : <><span className="hidden sm:inline">{tc('saveAll')}</span><span className="sm:hidden">{tc('save')}</span></>}
            </button>
          </div>

          {/* Padding so sticky bar doesn't cover content */}
          <div className="sm:hidden h-16" />

        </div>
      </div>

      {/* Sticky save bar on mobile */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 px-3 py-2 flex items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <Link href="/dashboard/admin/models" className="flex-1 text-center px-3 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg">{tc('cancel')}</Link>
        <button onClick={handleSave} disabled={saving}
          className="flex-[2] flex items-center justify-center gap-1.5 px-3 py-2.5 bg-brand text-white rounded-lg text-sm font-bold disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? tc('savingDots') : tc('save')}
        </button>
      </div>
    </div>
  )
}
