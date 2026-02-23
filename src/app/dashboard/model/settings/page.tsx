'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Trash2, Bell } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // User data
  const [email, setEmail] = useState('')
  const [profileEnabled, setProfileEnabled] = useState(true)
  const [newsletter, setNewsletter] = useState(false)
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, profile_status, newsletter_enabled')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      setEmail(profile.email)
      setProfileEnabled(profile.profile_status === 'active')
      setNewsletter(profile.newsletter_enabled || false)
      
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileStatusToggle = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newStatus = profileEnabled ? 'inactive' : 'active'

      const { error } = await supabase
        .from('profiles')
        .update({ profile_status: newStatus })
        .eq('id', user.id)

      if (error) throw error

      setProfileEnabled(!profileEnabled)
      alert(profileEnabled ? 'Profile disabled' : 'Profile enabled')
    } catch (error) {
      console.error('Error updating profile status:', error)
      alert('Failed to update profile status')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    // Password requirements: 8-20 chars, 1 uppercase, 1 digit, one of !_+-@
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!_+@\-])[A-Za-z\d!_+@\-]{8,20}$/
    if (!passwordRegex.test(newPassword)) {
      alert('Password must be 8-20 characters with at least 1 uppercase letter, 1 digit, and one of: !_+-@')
      return
    }

    try {
      setSaving(true)

      // First verify current password is correct
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword
      })

      if (signInError) {
        alert('Current password is incorrect')
        return
      }

      // If current password is correct, update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      alert('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error changing password:', error)
      alert(error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will remove all your data, reviews, and advertising history.'
    )

    if (!confirmed) return

    const doubleConfirm = confirm(
      'FINAL WARNING: This will permanently delete your account. Are you absolutely sure?'
    )

    if (!doubleConfirm) return

    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete user profile (cascade will handle related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (error) throw error

      // Sign out
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Failed to delete account. Please contact support.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 ml-[280px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 ml-[280px] bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Associated Email */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Associated Email
          </h2>
          <div className="flex items-start gap-4">
            <input
              type="email"
              value={email}
              disabled
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
            />
            <div className="flex-1">
              <p className="text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded-lg p-3">
                For your protection, in order to change this field please contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <p className="text-sm text-gray-600">
              Your new password must have between 8-20 alphanumeric characters and special symbols and contain at least: 
              1 upper case letter, a digit and one of the following symbols: !_+-@
            </p>

            <button
              onClick={handlePasswordChange}
              disabled={saving}
              className="w-full px-6 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Newsletter
          </h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={async (e) => {
                const newValue = e.target.checked
                setNewsletter(newValue)
                
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) return

                  const { error } = await supabase
                    .from('profiles')
                    .update({ newsletter_enabled: newValue })
                    .eq('id', user.id)

                  if (error) throw error
                } catch (error) {
                  console.error('Error updating newsletter:', error)
                  setNewsletter(!newValue) // revert on error
                }
              }}
              className="w-5 h-5 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
            />
            <span className="text-gray-700">
              Do you want to receive a newsletter from nicemodels.ch?
            </span>
          </label>
        </div>

        {/* Account Removal */}
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200 mb-6">
          <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Account Removal
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            Delete profile. <span className="font-bold">Attention!</span> This removes any reviews or days of advertising you have at the moment of deletion. 
            We strongly recommend you to first contact your account manager by{' '}
            <a href="/support" className="text-pink-600 hover:underline font-semibold">
              support ticket
            </a>
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={saving}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            DELETE ACCOUNT
          </button>
        </div>
      </div>
    </div>
  )
}
