'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings as SettingsIcon, Lock, Mail, AlertTriangle, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
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
      setError('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = prompt('This action cannot be undone. Type "DELETE" to confirm:')

    if (confirmation !== 'DELETE') {
      return
    }

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_blocked: true,
          blocked_reason: 'Account deletion requested by user',
          blocked_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      alert('Your account has been marked for deletion. You will be logged out now.')
      await supabase.auth.signOut()
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to delete account. Please contact support.')
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
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-xs text-gray-500">Manage your account settings and preferences</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/company')}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
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
            <p className="text-sm font-bold text-gray-800">Account Information</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{user?.email}</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                Verified
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500">Account Type</p>
                <p className="text-sm text-gray-900">Club / Agency</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs font-semibold text-gray-500">Member Since</p>
                <p className="text-sm text-gray-900">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
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
            <p className="text-sm font-bold text-gray-800">Change Password</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <p className="text-sm font-bold text-gray-800 mb-3">Notification Preferences</p>
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
                <span className="text-sm font-semibold text-gray-900">Email Notifications</span>
                <p className="text-xs text-gray-500 mt-0.5">Updates about your club, inquiries, and system messages</p>
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
                <span className="text-sm font-semibold text-gray-900">SMS Notifications</span>
                <span className="text-xs text-gray-500 ml-1">(Coming soon)</span>
                <p className="text-xs text-gray-500 mt-0.5">Instant alerts via SMS</p>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 rounded-lg p-3.5 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-bold text-red-700">Danger Zone</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-sm text-gray-700 mb-3">
              Once you delete your account, there is no going back. All your data, club information, and model links will be affected.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
            >
              Delete My Account
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
