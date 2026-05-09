'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Settings as SettingsIcon, Lock, Mail, AlertTriangle, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.company.settings')
  const tc = useTranslations('dashboard.company.common')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setLoading(false)
    }

    loadData()
  }, [router])

  const handleChangePassword = async () => {
    setError('')
    setSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('errFillFields'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('errMismatch'))
      return
    }

    if (newPassword.length < 8) {
      setError(t('errMinLength'))
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess(t('successChanged'))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || t('errChangeFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = prompt(t('deleteConfirm'))

    if (confirmation !== 'DELETE') {
      return
    }

    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Self-deletion from company settings' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('deleteFailedShort'))
      }

      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: any) {
      setError(err.message || t('deleteFailed'))
    }
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-xs text-gray-500">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/company')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            {tc('backToDashboard')}
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

        {/* Account Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('accountInfo')}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500">{t('email')}</p>
                <p className="text-sm text-gray-900">{user?.email}</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                {t('verified')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500">{t('accountType')}</p>
                <p className="text-sm text-gray-900">{t('clubAgency')}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500">{t('memberSince')}</p>
                <p className="text-sm text-gray-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : t('notAvailable')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-gray-800">{t('changePassword')}</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">{t('currentPassword')}</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('currentPasswordPh')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">{t('newPassword')}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPh')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">{t('confirmPassword')}</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPh')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? t('updating') : t('updatePassword')}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <p className="text-sm font-bold text-gray-800 mb-3">{t('notifPrefs')}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="email-notif"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <label htmlFor="email-notif" className="flex-1">
                <span className="text-sm font-semibold text-gray-900">{t('emailNotif')}</span>
                <p className="text-xs text-gray-500 mt-0.5">{t('emailNotifHint')}</p>
              </label>
            </div>
            <div className="flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-lg opacity-50">
              <input
                type="checkbox"
                id="sms-notif"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                disabled
                className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand"
              />
              <label htmlFor="sms-notif" className="flex-1">
                <span className="text-sm font-semibold text-gray-900">{t('smsNotif')}</span>
                <span className="text-xs text-gray-500 ml-1">{t('comingSoon')}</span>
                <p className="text-xs text-gray-500 mt-0.5">{t('smsNotifHint')}</p>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 rounded-lg p-3.5 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-bold text-red-700">{t('dangerZone')}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-sm text-gray-700 mb-3">
              {t('deleteWarn')}
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
            >
              {t('deleteBtn')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
