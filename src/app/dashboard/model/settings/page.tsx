'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Settings, Eye, EyeOff, Lock, Trash2, Bell, Save, CheckCircle, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')
  const [email, setEmail] = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        const { data: profile } = await supabase.from('profiles').select('email, profile_status, newsletter_enabled').eq('id', user.id).single()
        if (profile) { setEmail(profile.email); setNewsletter(profile.newsletter_enabled || false) }
      } catch { }
      finally { setLoading(false) }
    }
    loadSettings()
  }, [])

  const handlePasswordChange = async () => {
    setPwError(''); setPwSuccess('')
    if (!currentPassword || !newPassword || !confirmPassword) { setPwError('Please fill in all password fields'); return }
    if (newPassword !== confirmPassword) { setPwError('New passwords do not match'); return }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!_+@\-])[A-Za-z\d!_+@\-]{8,20}$/
    if (!passwordRegex.test(newPassword)) { setPwError('Password must be 8-20 chars with 1 uppercase, 1 digit, and one of: !_+-@'); return }
    setSaving(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
      if (signInError) { setPwError('Current password is incorrect'); return }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwSuccess('Password changed successfully!')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPwSuccess(''), 4000)
    } catch (e: any) {
      setPwError(e?.message || 'Failed to change password')
    } finally { setSaving(false) }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    if (!confirm('FINAL WARNING: This will permanently delete your account. Are you absolutely sure?')) return
    setSaving(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Self-deletion from model settings' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      await supabase.auth.signOut()
      router.push('/')
    } catch { alert('Failed to delete account. Please contact support.') }
    finally { setSaving(false) }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand'
  const eyeBtn = (show: boolean, toggle: () => void) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

  if (loading) return null

  return (
    <div className="flex-1 p-4 md:p-6 ml-0 md:ml-[280px] bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-xs text-gray-500">Manage your account settings and preferences</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <p className="text-sm font-bold text-gray-800 mb-3">Associated Email</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="email" value={email} disabled
              className="px-3 py-2 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed" />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                For your protection, to change this field please contact support at{' '}
                <a href="mailto:info@nicemodels.ch" className="font-semibold text-brand hover:underline">info@nicemodels.ch</a>.
              </p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-bold text-gray-800">Change Password</p>
          </div>
          {pwError && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">{pwError}</p>
            </div>
          )}
          {pwSuccess && (
            <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800">{pwSuccess}</p>
            </div>
          )}
          <div className="space-y-2.5 mb-3">
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'} value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password" className={inputCls + ' pr-10'} />
              {eyeBtn(showCurrent, () => setShowCurrent(!showCurrent))}
            </div>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password" className={inputCls + ' pr-10'} />
              {eyeBtn(showNew, () => setShowNew(!showNew))}
            </div>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password" className={inputCls + ' pr-10'} />
              {eyeBtn(showConfirm, () => setShowConfirm(!showConfirm))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-3">8-20 characters · at least 1 uppercase, 1 digit, one of: !_+-@</p>
          <button onClick={handlePasswordChange} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Newsletter */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-bold text-gray-800">Newsletter</p>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={newsletter}
              onChange={async e => {
                const val = e.target.checked
                setNewsletter(val)
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return
                  const { error } = await supabase.from('profiles').update({ newsletter_enabled: val }).eq('id', user.id)
                  if (error) throw error
                } catch { setNewsletter(!val) }
              }}
              className="w-4 h-4 text-brand rounded border-gray-300 focus:ring-brand" />
            <span className="text-sm text-gray-700">Receive newsletter from nicemodels.ch</span>
          </label>
        </div>

        {/* Delete Account */}
        <div className="bg-white border border-red-200 rounded-lg p-3.5 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 className="w-4 h-4 text-red-600" />
            <p className="text-sm font-bold text-red-600">Account Removal</p>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            <span className="font-bold">Warning!</span> This removes all your reviews and advertising history. Contact{' '}
            <a href="/support" className="text-brand hover:underline font-semibold">support</a> first if you need assistance.
          </p>
          <button onClick={handleDeleteAccount} disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
