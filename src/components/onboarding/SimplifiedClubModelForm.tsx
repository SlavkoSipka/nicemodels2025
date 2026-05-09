'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import RichTextEditor from '@/components/ui/RichTextEditor'

interface SimplifiedClubModelFormProps {
  clubId: string
}

export default function SimplifiedClubModelForm({ clubId }: SimplifiedClubModelFormProps) {
  const router = useRouter()
  const t = useTranslations('onboarding.simplifiedClubModel')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    // Basic Info
    stage_name: '',
    phone_number: '',
    age: '',
    gender: '',
    nationality: '',
    city: '',
    
    // Optional
    about_me: '',
    height_cm: '',
    weight_kg: '',
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Basic validation
    if (!formData.stage_name) {
      setError(t('errStageName'))
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      // Generate unique ID and username
      const profileId = crypto.randomUUID()
      const username = formData.stage_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now()
      const dummyEmail = `model_${profileId}@club.internal` // Dummy email
      
      // Create profile record (club-managed, no auth)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: profileId,
          email: dummyEmail, // Internal email
          username: username,
          role: 'model',
          is_draft: true, // Club-managed profile
          invited_by: clubId,
          onboarding_completed: true, // Club completes it
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Create model_details with club_id
      const { error: detailsError } = await supabase
        .from('model_details')
        .insert({
          model_id: profile.id, // Foreign key to profiles
          club_id: clubId, // Link to club
          showname: formData.stage_name,
          about_me: formData.about_me || null,
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          nationality: formData.nationality || null,
          city: formData.city || null,
        })

      if (detailsError) throw detailsError

      // Success! Redirect back to models list
      alert(t('successAlert'))
      router.push('/dashboard/company/models')
      
    } catch (err: any) {
      console.error('Error creating model:', err)
      setError(err.message || t('errGeneric'))
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <p className="text-sm text-blue-800">
          {t.rich('note', {
            b: (chunks) => <span className="font-semibold">{chunks}</span>,
          })}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('sectionBasic')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('stageName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.stage_name}
                onChange={(e) => handleChange('stage_name', e.target.value)}
                placeholder={t('stageNamePlaceholder')}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('phoneNumber')}
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                placeholder={t('phonePlaceholder')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('age')}
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => handleChange('age', e.target.value)}
                placeholder={t('agePlaceholder')}
                min="18"
                max="99"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('gender')}
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all"
              >
                <option value="">{t('genderSelect')}</option>
                <option value="female">{t('genderFemale')}</option>
                <option value="male">{t('genderMale')}</option>
                <option value="trans">{t('genderTrans')}</option>
                <option value="other">{t('genderOther')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('nationality')}
              </label>
              <input
                type="text"
                value={formData.nationality}
                onChange={(e) => handleChange('nationality', e.target.value)}
                placeholder={t('nationalityPlaceholder')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('city')}
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder={t('cityPlaceholder')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('heightCm')}
              </label>
              <input
                type="number"
                value={formData.height_cm}
                onChange={(e) => handleChange('height_cm', e.target.value)}
                placeholder={t('heightPlaceholder')}
                min="140"
                max="250"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {t('weightKg')}
              </label>
              <input
                type="number"
                value={formData.weight_kg}
                onChange={(e) => handleChange('weight_kg', e.target.value)}
                placeholder={t('weightPlaceholder')}
                min="40"
                max="200"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all"
              />
            </div>
          </div>
        </div>

        {/* About Me */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            {t('aboutMeOptional')}
          </label>
          <RichTextEditor
            value={formData.about_me}
            onChange={(val) => handleChange('about_me', val)}
            placeholder={t('aboutPlaceholder')}
            height={200}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/company/models')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-bold hover:from-pink-700 hover:to-rose-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? t('creating') : t('createProfile')}
          </button>
        </div>
      </form>
    </div>
  )
}

