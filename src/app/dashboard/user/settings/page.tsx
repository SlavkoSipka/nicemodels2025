'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, Mail, Bell, Lock, Trash2, CheckCircle } from 'lucide-react'

export default function UserSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newsletterEnabled, setNewsletterEnabled] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) { setProfile(data); setNewsletterEnabled(data.newsletter_enabled || false) }
    }
    setLoading(false)
  }

  const handleNewsletterToggle = async () => {
    setSaving(true); setSuccess('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles')
        .update({ newsletter_enabled: !newsletterEnabled, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      if (!error) {
        setNewsletterEnabled(!newsletterEnabled)
        setSuccess('Newsletter preferences updated!')
        setTimeout(() => setSuccess(''), 3000)
      }
    }
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    const confirmation = prompt('This action cannot be undone. Type "DELETE" to confirm:')
    if (confirmation !== 'DELETE') return
    setSaving(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Self-deletion from user settings' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } catch (e: any) {
      alert(e.message || 'Failed to delete account. Please contact support.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="ml-[280px] min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-xs text-gray-500">Manage your account preferences</p>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">{success}</p>
            </div>
          )}

          {/* Email Preferences */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-brand" />
              <p className="text-sm font-bold text-gray-800">Email Preferences</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold text-gray-800">Newsletter</p>
                <p className="text-xs text-gray-500">Receive updates and promotions</p>
              </div>
              <button onClick={handleNewsletterToggle} disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  newsletterEnabled ? 'bg-brand' : 'bg-gray-200'
                }`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  newsletterEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-bold text-gray-800">Notifications</p>
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              More notification options coming soon. You'll be able to customize what you receive.
            </p>
          </div>

          {/* Security */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-bold text-gray-800">Security</p>
            </div>
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
              Password change coming soon. For now, use the "Forgot Password" feature on the login page.
            </p>
          </div>

          {/* Danger Zone */}
          <div className="bg-white border border-red-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="w-4 h-4 text-red-600" />
              <p className="text-sm font-bold text-red-800">Danger Zone</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={saving}
              className="w-full text-left px-3 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <p className="text-sm font-semibold text-red-800">Delete Account</p>
              <p className="text-xs text-red-500 mt-0.5">Permanently delete your account and all data</p>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
