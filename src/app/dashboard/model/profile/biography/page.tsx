'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function BiographyEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
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
        if (!user) { router.push('/login'); return }
        setUser(user)

        const { data: md } = await supabase
          .from('model_details').select('*').eq('model_id', user.id).single()

        const norm = (v: string | null | undefined) =>
          v ? v.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '') : ''

        if (md) {
          setFormData({
            showname: md.showname || '',
            slogan: md.slogan || '',
            gender: norm(md.gender),
            ethnicity: norm(md.ethnicity),
            nationality: md.nationality || '',
            age: md.age?.toString() || '',
            hair_color: norm(md.hair_color),
            eye_color: norm(md.eye_color),
            height_cm: md.height_cm?.toString() || '',
            weight_kg: md.weight_kg?.toString() || '',
            dress_size: norm(md.dress_size),
            bust_cm: md.bust_cm?.toString() || '',
            waist_cm: md.waist_cm?.toString() || '',
            hip_cm: md.hip_cm?.toString() || '',
            pubic_hair: norm(md.pubic_hair),
            smoking: norm(md.smoking),
            drinking: norm(md.drinking),
            special_characteristics: md.special_characteristics || '',
          })
        }
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleChange = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setError('')
    setSuccess('')
    if (!formData.showname) { setError('Showname is required'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: e } = await supabase.from('model_details').upsert({
        model_id: user.id,
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
      }, { onConflict: 'model_id' })

      if (e) throw e
      setSuccess('Biography saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e: any) {
      setError(e?.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent'
  const labelCls = 'block text-xs font-bold text-gray-800 mb-1'
  const unitInput = (field: string, placeholder: string, unit: string) => (
    <div className="relative">
      <input type="number" value={formData[field as keyof typeof formData]}
        onChange={e => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className={inputCls + ' pr-10'} />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
    </div>
  )

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <User className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Edit Profile — Biography</h1>
              <p className="text-xs text-gray-500">Mandatory fields are marked with <span className="text-red-500">*</span></p>
            </div>
          </div>
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            Cancel
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

        {/* Basic BIO */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <p className="text-sm font-bold text-gray-800 mb-3">Basic BIO</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Showname <span className="text-red-500">*</span></label>
              <input type="text" value={formData.showname}
                onChange={e => handleChange('showname', e.target.value)}
                placeholder="marina" className={inputCls} />
              <p className="text-xs text-gray-400 mt-0.5">Appears on your profile</p>
            </div>
            <div>
              <label className={labelCls}>Slogan</label>
              <input type="text" value={formData.slogan}
                onChange={e => handleChange('slogan', e.target.value)}
                placeholder="Your slogan or keyword..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Gender</label>
              <select value={formData.gender} onChange={e => handleChange('gender', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="trans">Trans</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Ethnicity</label>
              <select value={formData.ethnicity} onChange={e => handleChange('ethnicity', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
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
              <label className={labelCls}>Nationality</label>
              <select value={formData.nationality} onChange={e => handleChange('nationality', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Afghanistan">Afghanistan</option>
                <option value="Albania">Albania</option>
                <option value="Algeria">Algeria</option>
                <option value="Argentina">Argentina</option>
                <option value="Armenia">Armenia</option>
                <option value="Australia">Australia</option>
                <option value="Austria">Austria</option>
                <option value="Azerbaijan">Azerbaijan</option>
                <option value="Belarus">Belarus</option>
                <option value="Belgium">Belgium</option>
                <option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
                <option value="Brazil">Brazil</option>
                <option value="Bulgaria">Bulgaria</option>
                <option value="Canada">Canada</option>
                <option value="Chile">Chile</option>
                <option value="China">China</option>
                <option value="Colombia">Colombia</option>
                <option value="Croatia">Croatia</option>
                <option value="Cuba">Cuba</option>
                <option value="Cyprus">Cyprus</option>
                <option value="Czech Republic">Czech Republic</option>
                <option value="Denmark">Denmark</option>
                <option value="Egypt">Egypt</option>
                <option value="Estonia">Estonia</option>
                <option value="Finland">Finland</option>
                <option value="France">France</option>
                <option value="Georgia">Georgia</option>
                <option value="Germany">Germany</option>
                <option value="Greece">Greece</option>
                <option value="Hungary">Hungary</option>
                <option value="India">India</option>
                <option value="Indonesia">Indonesia</option>
                <option value="Iran">Iran</option>
                <option value="Ireland">Ireland</option>
                <option value="Israel">Israel</option>
                <option value="Italy">Italy</option>
                <option value="Japan">Japan</option>
                <option value="Jordan">Jordan</option>
                <option value="Kazakhstan">Kazakhstan</option>
                <option value="Korea">Korea</option>
                <option value="Latvia">Latvia</option>
                <option value="Lebanon">Lebanon</option>
                <option value="Lithuania">Lithuania</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Mexico">Mexico</option>
                <option value="Moldova">Moldova</option>
                <option value="Morocco">Morocco</option>
                <option value="Netherlands">Netherlands</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Norway">Norway</option>
                <option value="Pakistan">Pakistan</option>
                <option value="Philippines">Philippines</option>
                <option value="Poland">Poland</option>
                <option value="Portugal">Portugal</option>
                <option value="Romania">Romania</option>
                <option value="Russia">Russia</option>
                <option value="Saudi Arabia">Saudi Arabia</option>
                <option value="Serbia">Serbia</option>
                <option value="Slovakia">Slovakia</option>
                <option value="Slovenia">Slovenia</option>
                <option value="South Africa">South Africa</option>
                <option value="Spain">Spain</option>
                <option value="Sweden">Sweden</option>
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
              <label className={labelCls}>Age</label>
              <input type="number" value={formData.age}
                onChange={e => handleChange('age', e.target.value)}
                min="18" max="99" placeholder="25" className={inputCls} />
            </div>
          </div>
        </div>

        {/* Physical Features */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <p className="text-sm font-bold text-gray-800 mb-3">Physical Features</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Hair Color</label>
              <select value={formData.hair_color} onChange={e => handleChange('hair_color', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                <option value="blond">Blond</option>
                <option value="light_brown">Light brown</option>
                <option value="brunette">Brunette</option>
                <option value="black">Black</option>
                <option value="red">Red</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Eye Color</label>
              <select value={formData.eye_color} onChange={e => handleChange('eye_color', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                <option value="black">Black</option>
                <option value="brown">Brown</option>
                <option value="green">Green</option>
                <option value="blue">Blue</option>
                <option value="gray">Gray</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Dress Size</label>
              <select value={formData.dress_size} onChange={e => handleChange('dress_size', e.target.value)} className={inputCls}>
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
              <label className={labelCls}>Height</label>
              {unitInput('height_cm', '165', 'cm')}
            </div>
            <div>
              <label className={labelCls}>Weight</label>
              {unitInput('weight_kg', '55', 'kg')}
            </div>
            <div>
              <label className={labelCls}>Bust</label>
              {unitInput('bust_cm', '90', 'cm')}
            </div>
            <div>
              <label className={labelCls}>Waist</label>
              {unitInput('waist_cm', '60', 'cm')}
            </div>
            <div>
              <label className={labelCls}>Hip</label>
              {unitInput('hip_cm', '90', 'cm')}
            </div>
            <div>
              <label className={labelCls}>Pubic Hair</label>
              <select value={formData.pubic_hair} onChange={e => handleChange('pubic_hair', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                <option value="shaved_completely">Shaved completely</option>
                <option value="shaved_mostly">Shaved mostly</option>
                <option value="trimmed">Trimmed</option>
                <option value="all_natural">All natural</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
          <p className="text-sm font-bold text-gray-800 mb-3">Additional Information</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelCls}>Smoking</label>
              <select value={formData.smoking} onChange={e => handleChange('smoking', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="occasionally">Occasionally</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Drinking</label>
              <select value={formData.drinking} onChange={e => handleChange('drinking', e.target.value)} className={inputCls}>
                <option value="">Select...</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="occasionally">Occasionally</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Special Characteristics</label>
            <textarea value={formData.special_characteristics}
              onChange={e => handleChange('special_characteristics', e.target.value)}
              rows={3}
              placeholder="Tattoos, piercings, etc."
              className={inputCls + ' resize-none'} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-2">
          <button onClick={() => router.back()} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
