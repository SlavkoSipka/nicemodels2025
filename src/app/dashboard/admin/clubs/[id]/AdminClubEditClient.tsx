'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft, Save, CheckCircle, AlertCircle, Building2, MapPin, Phone,
  Clock, ShieldCheck, Ban, ImageIcon, Film,
} from 'lucide-react'

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
    if (!basic.club_name) { setError('Club name is required'); return }
    if (!basic.display_name) { setError('Display name is required'); return }
    setSaving(true)

    try {
      // 1) Profile
      const { error: e1 } = await supabase.from('profiles').update({
        username: profileData.username,
        is_verified: profileData.is_verified,
        is_blocked: profileData.is_blocked,
        blocked_at: profileData.is_blocked ? new Date().toISOString() : null,
      }).eq('id', clubId)
      if (e1) throw e1

      // 2) Club details
      const { error: e2 } = await supabase.from('club_details').update({
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
      }).eq('club_id', clubId)
      if (e2) throw e2

      // 3) Contact details
      const { error: e3 } = await supabase.from('club_contact_details').upsert({
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
      }, { onConflict: 'club_id' })
      if (e3) throw e3

      // 4) Working hours
      await supabase.from('club_working_hours').delete().eq('club_id', clubId)
      const whInsert: any[] = []
      if (scheduleType === '24_7') {
        DAYS.forEach(d => whInsert.push({ club_id: clubId, day_of_week: d, opens_at: '00:00', closes_at: '23:59' }))
      } else if (scheduleType === 'same_every_day' && sameHours.from && sameHours.to) {
        DAYS.forEach(d => whInsert.push({ club_id: clubId, day_of_week: d, opens_at: sameHours.from, closes_at: sameHours.to }))
      } else if (scheduleType === 'custom') {
        DAYS.forEach(d => {
          if (customHours[d].from && customHours[d].to)
            whInsert.push({ club_id: clubId, day_of_week: d, opens_at: customHours[d].from, closes_at: customHours[d].to })
        })
      }
      if (whInsert.length > 0) {
        const { error: e4 } = await supabase.from('club_working_hours').insert(whInsert)
        if (e4) throw e4
      }

      setSuccess('All changes saved successfully!')
      setTimeout(() => setSuccess(''), 4000)
    } catch (e: any) {
      setError(e?.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <Link href="/dashboard/admin/clubs" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
              <ArrowLeft className="w-3 h-3" /> Back to Clubs
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {clubDetails?.display_name || clubDetails?.club_name || profile.username}
                  </h1>
                  <p className="text-xs text-gray-500">{profile.email} · ID: {clubId.slice(0, 8)}…</p>
                </div>
                {profileData.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
                {profileData.is_blocked && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                    <Ban className="w-3 h-3" /> Blocked
                  </span>
                )}
              </div>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save All Changes'}
              </button>
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

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'basic', label: 'Basic Info', icon: Building2 },
              { id: 'address', label: 'Address', icon: MapPin },
              { id: 'contact', label: 'Contact', icon: Phone },
              { id: 'hours', label: 'Working Hours', icon: Clock },
              { id: 'media', label: 'Media', icon: ImageIcon },
              { id: 'account', label: 'Account', icon: ShieldCheck },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`${tabBtn(t.id)} flex items-center gap-1.5`}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>

          {/* ════════ BASIC INFO ════════ */}
          {activeTab === 'basic' && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Club Name <span className="text-red-500">*</span></label>
                  <input value={basic.club_name} onChange={e => setBasic(p => ({ ...p, club_name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Display Name <span className="text-red-500">*</span></label>
                  <input value={basic.display_name} onChange={e => setBasic(p => ({ ...p, display_name: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Area / Region</label>
                <input value={basic.area} onChange={e => setBasic(p => ({ ...p, area: e.target.value }))} placeholder="e.g. Zurich Center" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>About (HTML)</label>
                <textarea value={basic.about_description} onChange={e => setBasic(p => ({ ...p, about_description: e.target.value }))}
                  rows={6} className={inputCls + ' resize-y font-mono text-xs'} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={basic.is_club}
                  onChange={e => setBasic(p => ({ ...p, is_club: e.target.checked }))}
                  className="w-4 h-4 text-brand rounded" />
                <span className="text-sm font-semibold text-gray-900">Physical club/venue</span>
              </label>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-800 mb-2">Amenities</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'entrance_fee', label: 'Entrance', opts: [{ v: 'na', l: 'N/A' }, { v: 'free', l: 'Free' }, { v: 'with_cost', l: 'With cost' }] },
                    { key: 'wellness', label: 'Wellness', opts: [{ v: 'na', l: 'N/A' }, { v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }] },
                    { key: 'food_and_drinks', label: 'Food & Drinks', opts: [{ v: 'na', l: 'N/A' }, { v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }] },
                    { key: 'outdoor_area', label: 'Outdoor', opts: [{ v: 'na', l: 'N/A' }, { v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }] },
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
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Street</label>
                  <input value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Number</label>
                  <input value={address.street_number} onChange={e => setAddress(p => ({ ...p, street_number: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Additional Info</label>
                <input value={address.additional_info} onChange={e => setAddress(p => ({ ...p, additional_info: e.target.value }))} placeholder="Floor, etc." className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>ZIP Code</label>
                  <input value={address.zip_code} onChange={e => setAddress(p => ({ ...p, zip_code: e.target.value }))} className={inputCls} />
                </div>
              </div>
            </div>
          )}

          {/* ════════ CONTACT ════════ */}
          {activeTab === 'contact' && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
              <div>
                <p className="text-sm font-bold text-gray-800 mb-3">Phone</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Country Code</label>
                    <input value={contact.country_code} onChange={e => setContact(p => ({ ...p, country_code: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className={labelCls}>Phone Number</label>
                    <input value={contact.phone_number} onChange={e => setContact(p => ({ ...p, phone_number: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 mb-2">Available on</p>
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
                <p className="text-xs font-bold text-gray-800 mb-2">Contact Preference</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'sms_and_call', label: 'SMS & Call' },
                    { value: 'sms_only', label: 'SMS Only' },
                    { value: 'call_only', label: 'Call Only' },
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
                <span className="text-sm font-semibold text-gray-900">No withheld numbers</span>
              </label>
              <div>
                <label className={labelCls}>Other Instructions</label>
                <textarea value={contact.other_instructions}
                  onChange={e => setContact(p => ({ ...p, other_instructions: e.target.value }))}
                  rows={3} className={inputCls + ' resize-none'} />
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-800 mb-3">Online Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input type="email" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Website</label>
                    <input type="url" value={contact.website} onChange={e => setContact(p => ({ ...p, website: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════ WORKING HOURS ════════ */}
          {activeTab === 'hours' && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex gap-2 mb-5 flex-wrap">
                {[
                  { id: '24_7' as const, label: 'Available 24/7' },
                  { id: 'same_every_day' as const, label: 'Same every day' },
                  { id: 'custom' as const, label: 'Custom schedule' },
                ].map(t => (
                  <button key={t.id} type="button" onClick={() => setScheduleType(t.id)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${scheduleType === t.id ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {scheduleType === '24_7' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <p className="text-sm text-emerald-800 font-semibold">Open 24/7</p>
                </div>
              )}
              {scheduleType === 'same_every_day' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Opens</label>
                    <input type="time" value={sameHours.from}
                      onChange={e => setSameHours(p => ({ ...p, from: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Closes</label>
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
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-brand" /> Photos ({photos.length})
                </p>
                {photos.length === 0 ? (
                  <p className="text-sm text-gray-400">No photos uploaded.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {photos.map((p: any) => (
                      <div key={p.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                        {p.url && <Image src={p.url} alt="" fill className="object-cover" sizes="120px" />}
                        <div className="absolute bottom-1 right-1">
                          {p.is_approved ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">OK</span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Film className="w-4 h-4 text-brand" /> Videos ({videos.length})
                </p>
                {videos.length === 0 ? (
                  <p className="text-sm text-gray-400">No videos uploaded.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {videos.map((v: any) => (
                      <div key={v.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                        {v.url && <video src={v.url} className="w-full h-full object-cover" />}
                        <div className="absolute bottom-1 right-1">
                          {v.is_approved ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">OK</span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">Pending</span>
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
            <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Username</label>
                  <input value={profileData.username} onChange={e => setProfileData(p => ({ ...p, username: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email (read-only)</label>
                  <input value={profileData.email} disabled className={inputCls + ' bg-gray-50 text-gray-500'} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.is_verified}
                    onChange={e => setProfileData(p => ({ ...p, is_verified: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm font-semibold text-gray-900">Verified</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.is_blocked}
                    onChange={e => setProfileData(p => ({ ...p, is_blocked: e.target.checked }))}
                    className="w-4 h-4 text-red-600 rounded" />
                  <span className="text-sm font-semibold text-gray-900">Blocked</span>
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
            <Link href="/dashboard/admin/clubs" className="text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</Link>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand/90 disabled:opacity-50 transition-colors">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save All Changes'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
