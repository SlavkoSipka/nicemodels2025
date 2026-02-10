'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Settings, Mail, Bell, Lock, Trash2, Loader2 } from 'lucide-react'

export default function UserSettings() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newsletterEnabled, setNewsletterEnabled] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setProfile(data)
        setNewsletterEnabled(data.newsletter_enabled || false)
      }
    }
    setLoading(false)
  }

  const handleNewsletterToggle = async () => {
    setSaving(true)
    setSuccessMessage('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({
          newsletter_enabled: !newsletterEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (!error) {
        setNewsletterEnabled(!newsletterEnabled)
        setSuccessMessage('Newsletter preferences updated!')
      }
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="ml-[280px] min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="ml-[280px] min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences</p>
        </div>

        <div className="max-w-3xl space-y-6">
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {successMessage}
            </div>
          )}

          {/* Email Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Mail className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Email Preferences</h2>
                <p className="text-sm text-gray-600">Manage your email notifications</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Newsletter</h3>
                  <p className="text-sm text-gray-600">Receive updates and promotions</p>
                </div>
                <button
                  onClick={handleNewsletterToggle}
                  disabled={saving}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    newsletterEnabled ? 'bg-pink-600' : 'bg-gray-300'
                  } disabled:opacity-50`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      newsletterEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-600">Control your notification preferences</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                More notification options coming soon. You'll be able to customize what you receive.
              </p>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Security</h2>
                <p className="text-sm text-gray-600">Manage your account security</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-left transition-colors">
                <h3 className="font-semibold text-gray-900 mb-1">Change Password</h3>
                <p className="text-sm text-gray-600">Update your password for security</p>
              </button>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-700">
                  Password change functionality coming soon. For now, use the "Forgot Password" feature on the login page.
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
                <p className="text-sm text-red-600">Irreversible actions</p>
              </div>
            </div>

            <button className="w-full p-4 bg-red-50 hover:bg-red-100 border-2 border-red-300 rounded-lg text-left transition-colors">
              <h3 className="font-semibold text-red-900 mb-1">Delete Account</h3>
              <p className="text-sm text-red-600">Permanently delete your account and all data</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
