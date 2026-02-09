'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AboutMePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aboutMe, setAboutMe] = useState('')
  const [user, setUser] = useState<any>(null)

  const MAX_CHARS = 25000

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        setUser(user)

        const { data: modelDetails } = await supabase
          .from('model_details')
          .select('about_me')
          .eq('model_id', user.id)
          .single()

        if (modelDetails?.about_me) {
          setAboutMe(modelDetails.about_me)
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleSave = async () => {
    setSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('model_details')
        .upsert({ model_id: user.id, about_me: aboutMe }, { onConflict: 'model_id' })

      if (error) throw error

      alert('About Me updated successfully!')
    } catch (error: any) {
      console.error('Error saving:', error)
      alert('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const applyFormatting = (tag: string) => {
    const textarea = document.getElementById('about-me-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = aboutMe.substring(start, end)

    if (selectedText) {
      const beforeText = aboutMe.substring(0, start)
      const afterText = aboutMe.substring(end)
      const formattedText = `<${tag}>${selectedText}</${tag}>`
      
      setAboutMe(beforeText + formattedText + afterText)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <span className="px-3 py-1 bg-pink-100 text-pink-600 rounded-lg text-sm font-semibold">
                About Me
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Describe yourself and write some additional information
            </p>
          </div>

          {/* About Me Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe yourself <span className="text-red-500">*</span>
            </label>
            
            <textarea
              id="about-me-textarea"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value.slice(0, MAX_CHARS))}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none mb-2"
              placeholder="Write about yourself, your services, what makes you special..."
            />

            {/* Formatting Buttons */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyFormatting('b')}
                  className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 font-bold text-sm"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('i')}
                  className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 italic text-sm"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => applyFormatting('u')}
                  className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 underline text-sm"
                  title="Underline"
                >
                  U
                </button>
              </div>

              {/* Character Counter */}
              <div className="text-sm text-gray-500">
                {aboutMe.length} / {MAX_CHARS}
              </div>
            </div>

          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4 mt-6">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'SAVE'}
            </button>
          </div>
        </div>
      </div>
  )
}
