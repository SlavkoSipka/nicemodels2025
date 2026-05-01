'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Save, CheckCircle, AlertCircle, Building2, MapPin, Phone,
  Clock, ShieldCheck, Ban, ImageIcon, Film,
} from 'lucide-react'
import AdminMessageButton from '@/components/admin/AdminMessageButton'

interface Props {
  clubId: string
  profile: any
  clubDetails: any
  contactDetails: any
  photos: any[]
  videos: any[]
  workingHours: any[]
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

type DayHours = { from: string; to: string }

export default function AdminClubEditClient({
  clubId, profile, clubDetails, contactDetails, photos, videos, workingHours: initWH,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('admin.clubEdit')
  const tc = useTranslations('admin.common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

  // ── Profile ──
  const [profileData, setProfileData] = useState({
    username: profile.username || '',
    email: profile.email || '',
    is_verified: profile.is_verified || false,
    is_blocked: profile.is_blocked || false,
  })

  // ── Basic info (club_details) ──
  const [basic, setBasic] = useState({
    club_name: clubDetails?.club_name || '',
    display_name: clubDetails?.display_name || '',
    area: clubDetails?.area || '',
    about_description: clubDetails?.about_description || '',
    is_club: clubDetails?.is_club || false,
    entrance_fee: clubDetails?.entrance_fee || 'na',
    wellness: clubDetails?.wellness || 'na',
    food_and_drinks: clubDetails?.food_and_drinks || 'na',
    outdoor_area: clubDetails?.outdoor_area || 'na',
  })

  // ── Address (club_details) ──
  const [address, setAddress] = useState({
    city: clubDetails?.city || '',
    zip_code: clubDetails?.zip_code || '',
    street: clubDetails?.street || '',
    street_number: clubDetails?.street_number || '',
    additional_info: clubDetails?.additional_info || '',
  })

  // ── Contact (club_contact_details) ──
  const [contact, setContact] = useState({
    country_code: contactDetails?.country_code || '+41',
    phone_number: contactDetails?.phone_number || '',
    has_viber: contactDetails?.has_viber || false,
    has_whatsapp: contactDetails?.has_whatsapp || false,
    has_telegram: contactDetails?.has_telegram || false,
    contact_instruction: contactDetails?.contact_instruction || 'sms_and_call',
    no_withheld_numbers: contactDetails?.no_withheld_numbers || false,
    other_instructions: contactDetails?.other_instructions || '',
    email: contactDetails?.email || '',
    website: contactDetails?.website || '',
  })

  // ── Working hours ──
  const initIs247 = initWH.length === 7 && initWH.every((h: any) => h.opens_at === '00:00:00' && h.closes_at === '23:59:00')
  const initAllSame = !initIs247 && initWH.length === 7 && initWH.every((h: any) => h.opens_at === initWH[0]?.opens_at && h.closes_at === initWH[0]?.closes_at)
  const [scheduleType, setScheduleType] = useState<'24_7' | 'same_every_day' | 'custom'>(
    initIs247 ? '24_7' : initAllSame ? 'same_every_day' : initWH.length > 0 ? 'custom' : '24_7'
  )
  const [sameHours, setSameHours] = useState<DayHours>(
    initAllSame ? { from: initWH[0]?.opens_at?.slice(0, 5) || '', to: initWH[0]?.closes_at?.slice(0, 5) || '' } : { from: '', to: '' }
  )
  const [customHours, setCustomHours] = useState<Record<string, DayHours>>(() => {
    const base: Record<string, DayHours> = {}
    DAYS.forEach(d => { base[d] = { from: '', to: '' } })
    if (!initIs247 && !initAllSame) {
      initWH.forEach((h: any) => {
        base[h.day_of_week] = { from: h.opens_at?.slice(0, 5) || '', to: h.closes_at?.slice(0, 5) || '' }
      })
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

  // ── Save All ──
  const handleSave = async () => {
    setError(''); setSuccess('')
    if (!basic.club_name) { setError(t('clubNameRequired')); return }
    if (!basic.display_name) { setError(t('displayNameRequired')); return }
    setSaving(true)

    try {
      const whRows: any[] = []
      if (scheduleType === '24_7') {
        DAYS.forEach(d => whRows.push({ club_id: clubId, day_of_week: d, opens_at: '00:00', closes_at: '23:59' }))
      } else if (scheduleType === 'same_every_day' && sameHours.from && sameHours.to) {
        DAYS.forEach(d => whRows.push({ club_id: clubId, day_of_week: d, opens_at: sameHours.from, closes_at: sameHours.to }))
      } else if (scheduleType === 'custom') {
        DAYS.forEach(d => {
          if (customHours[d].from && customHours[d].to)
            whRows.push({ club_id: clubId, day_of_week: d, opens_at: customHours[d].from, closes_at: customHours[d].to })
        })
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
          match: { id: clubId },
        },
        {
          action: 'update', table: 'club_details',
          data: {
            club_name: basic.club_name,
            display_name: basic.display_name,
            area: basic.area || null,
            about_description: basic.about_description || null,
            is_club: basic.is_club,
            entrance_fee: basic.entrance_fee,
            wellness: basic.wellness,
            food_and_drinks: basic.food_and_drinks,
            outdoor_area: basic.outdoor_area,
            city: address.city || null,
            zip_code: address.zip_code || null,
            street: address.street || null,
            street_number: address.street_number || null,
            additional_info: address.additional_info || null,
            updated_at: new Date().toISOString(),
          },
          match: { club_id: clubId },
        },
        {
          action: 'upsert', table: 'club_contact_details', onConflict: 'club_id',
          data: {
            club_id: clubId,
            country_code: contact.country_code,
            phone_number: contact.phone_number,
            has_viber: contact.has_viber,
            has_whatsapp: contact.has_whatsapp,
            has_telegram: contact.has_telegram,
            contact_instruction: contact.contact_instruction,
            no_withheld_numbers: contact.no_withheld_numbers,
            other_instructions: contact.other_instructions,
            email: contact.email,
            website: contact.website,
            updated_at: new Date().toISOString(),
          },
        },
        { action: 'delete', table: 'club_working_hours', match: { club_id: clubId } },
      ]

      if (whRows.length > 0) {
        operations.push({ action: 'insert', table: 'club_working_hours', data: whRows })
      }

      const res = await fetch('/api/admin/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations,
          notify: {
            userId: clubId,
            title: t('notifyTitle'),
            message: t('notifyMessage'),
            actionUrl: '/dashboard/company/profile/basic-info',
            relatedEntityType: 'profile',
            relatedEntityId: clubId,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <Link href="/dashboard/admin/clubs" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
              <ArrowLeft className="w-3 h-3" /> {t('back')}
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
                    {clubDetails?.display_name || clubDetails?.club_name || profile.username}
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
                  userId={clubId}
                  recipientEmail={profile.email}
                  recipientName={clubDetails?.display_name || clubDetails?.club_name || profile.username}
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

          {/* Tabs — horizontally scrollable on mobile */}
          <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 sm:pb-0">
            {[
              { id: 'basic', label: t('tabBasic'), icon: Building2 },
              { id: 'address', label: t('tabAddress'), icon: MapPin },
              { id: 'contact', label: t('tabContact'), icon: Phone },
              { id: 'hours', label: t('tabHours'), icon: Clock },
              { id: 'media', label: t('tabMedia'), icon: ImageIcon },
              { id: 'account', label: t('tabAccount'), icon: ShieldCheck },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`${tabBtn(tab.id)} flex items-center gap-1.5 shrink-0`}>
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>

          {/* ════════ BASIC INFO ════════ */}
          {activeTab === 'basic' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('clubName')} <span className="text-red-500">*</span></label>
                  <input value={basic.club_name} onChange={e => setBasic(p => ({ ...p, club_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('displayName')} <span className="text-red-500">*</span></label>
                  <input value={basic.display_name} onChange={e => setBasic(p => ({ ...p, display_name: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('areaRegion')}</label>
                <input value={basic.area} onChange={e => setBasic(p => ({ ...p, area: e.target.value }))} placeholder={t('areaPlaceholder')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('aboutHtml')}</label>
                <textarea value={basic.about_description} onChange={e => setBasic(p => ({ ...p, about_description: e.target.value }))}
                  rows={6} className={inputCls + ' resize-y font-mono text-xs'} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={basic.is_club}
                  onChange={e => setBasic(p => ({ ...p, is_club: e.target.checked }))}
                  className="w-4 h-4 text-brand rounded" />
                <span className="text-sm font-semibold text-gray-900">{t('physicalClub')}</span>
              </label>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800 mb-2">{t('amenities')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'entrance_fee', label: t('amenityEntrance'), opts: [{ v: 'na', l: t('amenityNa') }, { v: 'free', l: t('amenityFree') }, { v: 'with_cost', l: t('amenityWithCost') }] },
                    { key: 'wellness', label: t('amenityWellness'), opts: [{ v: 'na', l: t('amenityNa') }, { v: 'yes', l: tc('yes') }, { v: 'no', l: tc('no') }] },
                    { key: 'food_and_drinks', label: t('amenityFood'), opts: [{ v: 'na', l: t('amenityNa') }, { v: 'yes', l: tc('yes') }, { v: 'no', l: tc('no') }] },
                    { key: 'outdoor_area', label: t('amenityOutdoor'), opts: [{ v: 'na', l: t('amenityNa') }, { v: 'yes', l: tc('yes') }, { v: 'no', l: tc('no') }] },
                  ].map(a => (
                    <div key={a.key}>
                      <label className="block text-xs text-gray-500 mb-0.5">{a.label}</label>
                      <select value={(basic as any)[a.key]}
                        onChange={e => setBasic(p => ({ ...p, [a.key]: e.target.value }))}
                        className={inputCls}>
                        {a.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ ADDRESS ════════ */}
          {activeTab === 'address' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>{t('addressStreet')}</label>
                  <input value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('addressNumber')}</label>
                  <input value={address.street_number} onChange={e => setAddress(p => ({ ...p, street_number: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>{t('addressAdditionalInfo')}</label>
                <input value={address.additional_info} onChange={e => setAddress(p => ({ ...p, additional_info: e.target.value }))} placeholder={t('addressAdditionalPlaceholder')} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{t('addressCity')}</label>
                  <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>{t('addressZip')}</label>
                  <input value={address.zip_code} onChange={e => setAddress(p => ({ ...p, zip_code: e.target.value }))} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ════════ CONTACT ════════ */}
          {activeTab === 'contact' && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-5 space-y-4 sm:space-y-5">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-3">{t('phone')}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{t('countryCode')}</label>
                    <input value={contact.country_code} onChange={e => setContact(p => ({ ...p, country_code: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>{t('phoneNumber')}</label>
                    <input value={contact.phone_number} onChange={e => setContact(p => ({ ...p, phone_number: e.target.value }))} className={inputCls} />
                  </div>
                </div>
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
                    { value: 'call_only', label: t('callOnly') },
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
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-3">{t('onlineContact')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{t('email')}</label>
                    <input type="email" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('website')}</label>
                    <input type="url" value={contact.website} onChange={e => setContact(p => ({ ...p, website: e.target.value }))} className={inputCls} />
                  </div>
                </div>
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
                  <p className="text-sm text-emerald-800 font-semibold">{t('open247')}</p>
                </div>
              )}
              {scheduleType === 'same_every_day' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{t('opens')}</label>
                    <input type="time" value={sameHours.from}
                      onChange={e => setSameHours(p => ({ ...p, from: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>{t('closes')}</label>
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

          {/* ════════ MEDIA ════════ */}
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
                        {p.url && <Image src={p.url} alt="" fill className="object-cover" sizes="120px" />}
                        <div className="absolute bottom-1 right-1">
                          {p.is_approved ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">OK</span>
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
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">OK</span>
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
                <p>Created: {new Date(profile.created_at).toLocaleString()}</p>
                <p>Onboarding: {profile.onboarding_completed ? 'Completed' : 'Incomplete'}</p>
                {profile.blocked_at && <p>Blocked at: {new Date(profile.blocked_at).toLocaleString()}</p>}
              </div>
            </div>
          )}

          {/* Bottom save */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Link href="/dashboard/admin/clubs" className="text-sm font-semibold text-gray-600 hover:text-gray-900">{tc('cancel')}</Link>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? tc('savingDots') : <><span className="hidden sm:inline">{tc('saveAll')}</span><span className="sm:hidden">{tc('save')}</span></>}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
