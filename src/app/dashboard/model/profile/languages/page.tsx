'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Plus } from 'lucide-react'

export default function LanguagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [languages, setLanguages] = useState<{ language: string; level: string }[]>([])

  const availableLanguages = [
    'English', 'German', 'French', 'Italian', 'Spanish', 'Portuguese',
    'Russian', 'Polish', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
    'Czech', 'Romanian', 'Greek', 'Hungarian', 'Croatian', 'Serbian', 
    'Bulgarian', 'Ukrainian', 'Albanian', 'Slovak', 'Slovenian',
    'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Malay',
    'Arabic', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Other'
  ]

  const levels = [
    { value: 'basic', label: 'Basic' },
    { value: 'fair', label: 'Fair' },
    { value: 'good', label: 'Good' },
    { value: 'excellent_native', label: 'Excellent / Native' }
  ]

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

        const { data: languagesData } = await supabase
          .from('model_languages')
          .select('*')
          .eq('model_id', user.id)

        if (languagesData && languagesData.length > 0) {
          setLanguages(languagesData)
        } else {
          // Start with one empty language
          setLanguages([{ language: '', level: 'good' }])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const addLanguage = () => {
    setLanguages([...languages, { language: '', level: 'good' }])
  }

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index))
  }

  const updateLanguage = (index: number, field: 'language' | 'level', value: string) => {
    const updated = [...languages]
    updated[index][field] = value
    setLanguages(updated)
  }

  const handleSave = async () => {
    const validLanguages = languages.filter(l => l.language)

    if (validLanguages.length === 0) {
      alert('Please add at least one language')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      // Delete existing languages
      await supabase.from('model_languages').delete().eq('model_id', user.id)

      // Insert new languages
      const { error } = await supabase.from('model_languages').insert(
        validLanguages.map(lang => ({
          model_id: user.id,
          language: lang.language,
          level: lang.level
        }))
      )

      if (error) throw error

      alert('Languages updated successfully!')
    } catch (error: any) {
      console.error('Error saving:', error)
      alert('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
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
                Languages
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Add languages you speak and your proficiency level
            </p>
          </div>

          {/* Languages Form */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="space-y-4">
              {languages.map((lang, index) => (
                <div key={index} className="flex gap-3">
                  <select
                    value={lang.language}
                    onChange={(e) => updateLanguage(index, 'language', e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Select language...</option>
                    {availableLanguages.map(language => (
                      <option key={language} value={language}>{language}</option>
                    ))}
                  </select>

                  <select
                    value={lang.level}
                    onChange={(e) => updateLanguage(index, 'level', e.target.value)}
                    className="w-40 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    {levels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>

                  {languages.length > 1 && (
                    <button
                      onClick={() => removeLanguage(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove language"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addLanguage}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-pink-600 hover:bg-pink-50 rounded-lg transition-all font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Language</span>
            </button>
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
