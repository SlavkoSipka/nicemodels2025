'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Save, CheckCircle } from 'lucide-react'
import CitySearch, { type CityResult } from '@/components/ui/CitySearch'
import RichTextEditor from '@/components/ui/RichTextEditor'

export default function UserProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [success, setSuccess] = useState('')

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
        setPhone(data.phone || '')
        setCity(data.city || '')
        setDescription(data.description || '')
      }
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setSuccess('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { error } = await supabase.from('profiles').update({
        username, phone, city: city || null, description: description || null,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)
      if (!error) {
        setSuccess('Profile updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
        await loadProfile()
      }
    }
    setSaving(false)
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent'
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
              <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
              <p className="text-xs text-gray-500">Manage your personal information</p>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" value={profile?.email || ''} disabled
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg text-gray-500 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-0.5">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="Enter your phone number" className={inputCls} />
              </div>
            </div>

            <div>
              <CitySearch
                value={city}
                onChange={(c) => setCity(c?.name || '')}
                label="City / Area"
                placeholder="Search city or PLZ..."
              />
            </div>

            <RichTextEditor
              value={description}
              onChange={setDescription}
              label="About Me"
              placeholder="Tell us a bit about yourself..."
              maxLength={500}
              height={200}
            />

            <div>
              <label className={labelCls}>Member Since</label>
              <input type="text" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''} disabled
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg text-gray-500 cursor-not-allowed" />
            </div>

            <div className="flex justify-end pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
