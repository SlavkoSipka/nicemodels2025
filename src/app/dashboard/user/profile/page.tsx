'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { User, Save, CheckCircle, Camera, Trash2, Loader2 } from 'lucide-react'
import CitySearch from '@/components/ui/CitySearch'
import RichTextEditor from '@/components/ui/RichTextEditor'
import PhoneInput from '@/components/ui/PhoneInput'
import Image from 'next/image'
import { formatDobDisplay } from '@/lib/utils/dob'
import { splitPhone, joinPhone, DEFAULT_DIAL_CODE } from '@/lib/countries'

const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function UserProfile() {
  const t = useTranslations('dashboard.user.profile')
  const tc = useTranslations('dashboard.user.common')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_DIAL_CODE)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [success, setSuccess] = useState('')

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setUsername(data.username || '')
        const { dialCode, number } = splitPhone(data.phone)
        setPhoneCountry(dialCode)
        setPhoneNumber(number)
        setCity(data.city || '')
        setDescription(data.description || '')
        setFirstName(data.first_name || '')
        setLastName(data.last_name || '')
        setAvatarUrl(data.avatar_url || null)
      }
    }
    setLoading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError('')

    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError(t('onlyImageTypes'))
      return
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError(t('imageTooLarge'))
      return
    }

    setAvatarUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ext = file.name.split('.').pop()?.toLowerCase() || 'webp'
      const filePath = `${user.id}/avatar.${ext}`

      const { data: existingFiles } = await supabase.storage
        .from('user-avatars')
        .list(user.id)
      if (existingFiles?.length) {
        const oldPaths = existingFiles
          .filter(f => f.name !== `avatar.${ext}`)
          .map(f => `${user.id}/${f.name}`)
        if (oldPaths.length) {
          await supabase.storage.from('user-avatars').remove(oldPaths)
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath)
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase.from('profiles').update({
        avatar_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)
      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setSuccess(t('photoUpdated'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      setAvatarError(err.message || t('photoUploadFailed'))
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAvatarRemove = async () => {
    if (!confirm(t('removeConfirm'))) return
    setAvatarUploading(true)
    setAvatarError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: files } = await supabase.storage
        .from('user-avatars')
        .list(user.id)
      if (files?.length) {
        await supabase.storage
          .from('user-avatars')
          .remove(files.map(f => `${user.id}/${f.name}`))
      }

      await supabase.from('profiles').update({
        avatar_url: null,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)

      setAvatarUrl(null)
      setSuccess(t('photoRemoved'))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setAvatarError(err.message || t('photoRemoveFailed'))
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setSuccess('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles').update({
        username,
        phone: joinPhone(phoneCountry, phoneNumber) || null,
        city: city || null,
        description: description || null,
        first_name: firstName || null,
        last_name: lastName || null,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)
      if (!error) {
        setSuccess(t('profileUpdated'))
        setTimeout(() => setSuccess(''), 3000)
        await loadProfile()
      }
    }
    setSaving(false)
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent'
  const readonlyCls = 'w-full px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg text-gray-500 cursor-not-allowed'
  const labelCls = 'block text-xs font-bold text-gray-800 mb-1'

  if (loading) return null

  return (
    <div className="ml-0 md:ml-[280px] min-h-screen bg-gray-50">
      <div className="py-4 md:py-6 px-4 md:px-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <User className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">{success}</p>
            </div>
          )}

          {/* Avatar Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <label className={labelCls}>{t('photoLabel')}</label>
            <div className="flex items-center gap-5 mt-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand/20 to-pink-100 flex items-center justify-center">
                      <span className="text-3xl font-bold text-brand/60">
                        {(username || profile?.email || '?')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-bold hover:bg-brand-hover disabled:opacity-50 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {avatarUrl ? t('changePhoto') : t('uploadPhoto')}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleAvatarRemove}
                      disabled={avatarUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('removePhoto')}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">{t('photoHint')}</p>
                {avatarError && <p className="text-xs text-red-500">{avatarError}</p>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className={labelCls}>{t('email')}</label>
              <input type="email" value={profile?.email || ''} disabled className={readonlyCls} />
              <p className="text-xs text-gray-400 mt-0.5">{t('emailHint')}</p>
            </div>

            {/* Phone & DOB row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('phone')}</label>
                <PhoneInput
                  countryCode={phoneCountry}
                  phoneNumber={phoneNumber}
                  onCountryCodeChange={setPhoneCountry}
                  onPhoneNumberChange={setPhoneNumber}
                  placeholder={t('phonePlaceholder')}
                />
              </div>
              <div>
                <label className={labelCls}>{t('dob')}</label>
                <input
                  type="text"
                  value={formatDobDisplay(profile?.date_of_birth) || t('dobNotSet')}
                  disabled
                  className={readonlyCls}
                />
                <p className="text-xs text-gray-400 mt-0.5">{t('dobHint')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>{t('username')}</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder={t('usernamePlaceholder')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('city')}</label>
                <CitySearch
                  value={city}
                  onChange={(c) => setCity(c?.name || '')}
                  placeholder={t('cityPlaceholder')}
                />
              </div>
            </div>

            {/* Real name */}
            <div>
              <p className="text-xs text-gray-400 mb-2">{t('realNameNote')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    {t('firstName')} <span className="font-normal text-gray-400">{t('optional')}</span>
                  </label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder={t('firstNamePlaceholder')} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>
                    {t('lastName')} <span className="font-normal text-gray-400">{t('optional')}</span>
                  </label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder={t('lastNamePlaceholder')} className={inputCls} />
                </div>
              </div>
            </div>

            <RichTextEditor
              value={description}
              onChange={setDescription}
              label={t('aboutMe')}
              placeholder={t('aboutMePlaceholder')}
              maxLength={500}
              height={200}
            />

            <div>
              <label className={labelCls}>{t('memberSince')}</label>
              <input type="text" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''} disabled
                className={readonlyCls} />
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="w-4 h-4" />
                {saving ? tc('saving') : t('saveChanges')}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
