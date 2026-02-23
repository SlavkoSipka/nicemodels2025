'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function BiographyEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    showname: '',
    slogan: '',
    gender: '',
    ethnicity: '',
    nationality: '',
    age: '',
    hair_color: '',
    eye_color: '',
    height_cm: '',
    weight_kg: '',
    dress_size: '',
    bust_cm: '',
    waist_cm: '',
    hip_cm: '',
    pubic_hair: '',
    smoking: '',
    drinking: '',
    special_characteristics: '',
  })

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

        // Load existing model details
        const { data: modelDetails } = await supabase
          .from('model_details')
          .select('*')
          .eq('model_id', user.id)
          .single()

        // helper: normalize legacy Capitalized enum values to lowercase/snake_case
        const norm = (v: string | null | undefined) =>
          v ? v.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '') : ''

        if (modelDetails) {
          setFormData({
            showname: modelDetails.showname || '',
            slogan: modelDetails.slogan || '',
            gender: norm(modelDetails.gender),
            ethnicity: norm(modelDetails.ethnicity),
            nationality: modelDetails.nationality || '',
            age: modelDetails.age?.toString() || '',
            hair_color: norm(modelDetails.hair_color),
            eye_color: norm(modelDetails.eye_color),
            height_cm: modelDetails.height_cm?.toString() || '',
            weight_kg: modelDetails.weight_kg?.toString() || '',
            dress_size: norm(modelDetails.dress_size),
            bust_cm: modelDetails.bust_cm?.toString() || '',
            waist_cm: modelDetails.waist_cm?.toString() || '',
            hip_cm: modelDetails.hip_cm?.toString() || '',
            pubic_hair: norm(modelDetails.pubic_hair),
            smoking: norm(modelDetails.smoking),
            drinking: norm(modelDetails.drinking),
            special_characteristics: modelDetails.special_characteristics || '',
          })
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.showname) {
      alert('Showname is required')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      const updateData = {
        showname: formData.showname,
        slogan: formData.slogan || null,
        gender: formData.gender || null,
        ethnicity: formData.ethnicity || null,
        nationality: formData.nationality || null,
        age: formData.age ? parseInt(formData.age) : null,
        hair_color: formData.hair_color || null,
        eye_color: formData.eye_color || null,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        dress_size: formData.dress_size || null,
        bust_cm: formData.bust_cm ? parseInt(formData.bust_cm) : null,
        waist_cm: formData.waist_cm ? parseInt(formData.waist_cm) : null,
        hip_cm: formData.hip_cm ? parseInt(formData.hip_cm) : null,
        pubic_hair: formData.pubic_hair || null,
        smoking: formData.smoking || null,
        drinking: formData.drinking || null,
        special_characteristics: formData.special_characteristics || null,
      }

      const { error } = await supabase
        .from('model_details')
        .upsert({ model_id: user.id, ...updateData }, { onConflict: 'model_id' })

      if (error) {
        console.error('Supabase upsert error:', error)
        alert('Failed to save changes: ' + (error.message || error.details || JSON.stringify(error)))
        return
      }

      alert('Biography updated successfully!')
    } catch (error: any) {
      console.error('Error saving:', error)
      alert('Failed to save changes: ' + (error?.message || String(error)))
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
                Biography
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Set/edit basic information of your profile. Mandatory fields are marked with an <span className="text-red-500 font-bold">*</span> (star).
            </p>
            <p className="text-sm text-gray-600">
              Once you have updated your info, don't forget to save the changes.
            </p>
          </div>

          {/* Basic BIO */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic BIO</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Showname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.showname}
                  onChange={(e) => handleChange('showname', e.target.value)}
                  placeholder="marina"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Name which will appear on your profile</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slogan
                </label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  placeholder="Put here a slogan or keyword..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Put here a slogan or keyword which describes you and/or your service the best</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="trans">Trans</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ethnicity
                </label>
                <select
                  value={formData.ethnicity}
                  onChange={(e) => handleChange('ethnicity', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select ethnicity</option>
                  <option value="asian">Asian</option>
                  <option value="black">Black</option>
                  <option value="caucasian_white">Caucasian (white)</option>
                  <option value="latin">Latin</option>
                  <option value="mixed">Mixed</option>
                  <option value="indian">Indian</option>
                  <option value="arab">Arab</option>
                  <option value="caucasian">Caucasian</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nationality
                </label>
                <select
                  value={formData.nationality}
                  onChange={(e) => handleChange('nationality', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select nationality</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Afghanistan">Afghanistan</option>
                  <option value="Albania">Albania</option>
                  <option value="Algeria">Algeria</option>
                  <option value="Andorra">Andorra</option>
                  <option value="Angola">Angola</option>
                  <option value="Argentina">Argentina</option>
                  <option value="Armenia">Armenia</option>
                  <option value="Australia">Australia</option>
                  <option value="Austria">Austria</option>
                  <option value="Azerbaijan">Azerbaijan</option>
                  <option value="Bahamas">Bahamas</option>
                  <option value="Bahrain">Bahrain</option>
                  <option value="Bangladesh">Bangladesh</option>
                  <option value="Barbados">Barbados</option>
                  <option value="Belarus">Belarus</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Belize">Belize</option>
                  <option value="Benin">Benin</option>
                  <option value="Bhutan">Bhutan</option>
                  <option value="Bolivia">Bolivia</option>
                  <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                  <option value="Botswana">Botswana</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Brunei">Brunei</option>
                  <option value="Bulgaria">Bulgaria</option>
                  <option value="Burkina Faso">Burkina Faso</option>
                  <option value="Cambodia">Cambodia</option>
                  <option value="Cameroon">Cameroon</option>
                  <option value="Canada">Canada</option>
                  <option value="Chile">Chile</option>
                  <option value="China">China</option>
                  <option value="Colombia">Colombia</option>
                  <option value="Costa Rica">Costa Rica</option>
                  <option value="Croatia">Croatia</option>
                  <option value="Cuba">Cuba</option>
                  <option value="Cyprus">Cyprus</option>
                  <option value="Czech Republic">Czech Republic</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Dominican Republic">Dominican Republic</option>
                  <option value="Ecuador">Ecuador</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Estonia">Estonia</option>
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="Finland">Finland</option>
                  <option value="France">France</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Germany">Germany</option>
                  <option value="Greece">Greece</option>
                  <option value="Hungary">Hungary</option>
                  <option value="Iceland">Iceland</option>
                  <option value="India">India</option>
                  <option value="Indonesia">Indonesia</option>
                  <option value="Iran">Iran</option>
                  <option value="Iraq">Iraq</option>
                  <option value="Ireland">Ireland</option>
                  <option value="Israel">Israel</option>
                  <option value="Italy">Italy</option>
                  <option value="Jamaica">Jamaica</option>
                  <option value="Japan">Japan</option>
                  <option value="Jordan">Jordan</option>
                  <option value="Kazakhstan">Kazakhstan</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Korea">Korea</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="Latvia">Latvia</option>
                  <option value="Lebanon">Lebanon</option>
                  <option value="Libya">Libya</option>
                  <option value="Lithuania">Lithuania</option>
                  <option value="Luxembourg">Luxembourg</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Mexico">Mexico</option>
                  <option value="Moldova">Moldova</option>
                  <option value="Monaco">Monaco</option>
                  <option value="Morocco">Morocco</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="New Zealand">New Zealand</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Norway">Norway</option>
                  <option value="Pakistan">Pakistan</option>
                  <option value="Peru">Peru</option>
                  <option value="Philippines">Philippines</option>
                  <option value="Poland">Poland</option>
                  <option value="Portugal">Portugal</option>
                  <option value="Romania">Romania</option>
                  <option value="Russia">Russia</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Serbia">Serbia</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Slovakia">Slovakia</option>
                  <option value="Slovenia">Slovenia</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Spain">Spain</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Syria">Syria</option>
                  <option value="Thailand">Thailand</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Ukraine">Ukraine</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="Venezuela">Venezuela</option>
                  <option value="Vietnam">Vietnam</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleChange('age', e.target.value)}
                  min="18"
                  max="99"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Physical Features */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Physical Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hair Color
                </label>
                <select
                  value={formData.hair_color}
                  onChange={(e) => handleChange('hair_color', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select hair color</option>
                  <option value="blond">Blond</option>
                  <option value="light_brown">Light brown</option>
                  <option value="brunette">Brunette</option>
                  <option value="black">Black</option>
                  <option value="red">Red</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Eye Color
                </label>
                <select
                  value={formData.eye_color}
                  onChange={(e) => handleChange('eye_color', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select eye color</option>
                  <option value="black">Black</option>
                  <option value="brown">Brown</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="gray">Gray</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Height
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.height_cm}
                    onChange={(e) => handleChange('height_cm', e.target.value)}
                    placeholder="165"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weight
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.weight_kg}
                    onChange={(e) => handleChange('weight_kg', e.target.value)}
                    placeholder="55"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dress Size
                </label>
                <select
                  value={formData.dress_size}
                  onChange={(e) => handleChange('dress_size', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="xs">XS</option>
                  <option value="s">S</option>
                  <option value="m">M</option>
                  <option value="l">L</option>
                  <option value="xl">XL</option>
                  <option value="xxl">XXL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bust
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.bust_cm}
                    onChange={(e) => handleChange('bust_cm', e.target.value)}
                    placeholder="90"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Waist
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.waist_cm}
                    onChange={(e) => handleChange('waist_cm', e.target.value)}
                    placeholder="60"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hip
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.hip_cm}
                    onChange={(e) => handleChange('hip_cm', e.target.value)}
                    placeholder="90"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">cm</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pubic Hair
                </label>
                <select
                  value={formData.pubic_hair}
                  onChange={(e) => handleChange('pubic_hair', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="shaved_completely">Shaved completely</option>
                  <option value="shaved_mostly">Shaved mostly</option>
                  <option value="trimmed">Trimmed</option>
                  <option value="all_natural">All natural</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Smoking
                </label>
                <select
                  value={formData.smoking}
                  onChange={(e) => handleChange('smoking', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="occasionally">Occasionally</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Drinking
                </label>
                <select
                  value={formData.drinking}
                  onChange={(e) => handleChange('drinking', e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="occasionally">Occasionally</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Special Characteristics
              </label>
              <textarea
                value={formData.special_characteristics}
                onChange={(e) => handleChange('special_characteristics', e.target.value)}
                rows={4}
                placeholder="Please mention any special characteristics e.g. tattoos, piercings, etc."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
  )
}
