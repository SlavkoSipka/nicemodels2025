'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, MapPin, Phone, DollarSign, Calendar, Ruler, Upload, X } from 'lucide-react'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    bio: '',
    location_city: '',
    location_country: 'Switzerland',
    postal_code: '',
    address: '',
    phone_number: '',
    age: '',
    height: '',
    weight: '',
    bust_size: '',
    hair_color: '',
    eye_color: '',
    ethnicity: '',
    body_type: '',
    price_per_hour: '',
    price_per_night: '',
    working_hours: '',
  })

  const [services, setServices] = useState<string[]>([])
  const [contactPrefs, setContactPrefs] = useState({
    prefers_sms: true,
    prefers_call: true,
    prefers_whatsapp: true,
    prefers_telegram: false,
  })

  // Services options
  const servicesOptions = [
    'Girlfriend Experience (GFE)',
    'Erotic Massage',
    'Tantric Massage',
    'Couples',
    'Outcall',
    'Incall',
    'Anal Sex',
    'Oral without condom (OWO)',
    'French Kissing',
    '69 Position',
    'Striptease',
    'Role Play',
    'BDSM',
    'Fetish',
    'Foot Fetish',
    'Golden Shower',
    'Toys',
    'Webcam',
    'Dinner Date',
    'Overnight',
    'Travel Companion',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Update model_details
      const { error: updateError } = await supabase
        .from('model_details')
        .upsert({
          id: user.id,
          ...profileData,
          age: profileData.age ? parseInt(profileData.age) : null,
          height: profileData.height ? parseInt(profileData.height) : null,
          weight: profileData.weight ? parseInt(profileData.weight) : null,
          price_per_hour: profileData.price_per_hour ? parseFloat(profileData.price_per_hour) : null,
          price_per_night: profileData.price_per_night ? parseFloat(profileData.price_per_night) : null,
          services: services,
          ...contactPrefs,
        })

      if (updateError) throw updateError

      setSuccess('Profile updated successfully!')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const toggleService = (service: string) => {
    setServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50/30 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-large p-8 md:p-10 border border-gray-100 animate-fade-in">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-8">Edit Profile</h1>

          {error && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-soft font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 text-green-800 px-6 py-4 rounded-xl mb-6 shadow-soft font-medium">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <section className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 mb-6 border border-pink-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-2 mr-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name / Stage Name
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="+41 79 123 45 67"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio / Description
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </section>

            {/* Location */}
            <section className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mb-6 border border-blue-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-2 mr-3">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                Location
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={profileData.location_city}
                    onChange={(e) => setProfileData({ ...profileData, location_city: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="Zurich, Geneva, Basel..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={profileData.postal_code}
                    onChange={(e) => setProfileData({ ...profileData, postal_code: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="8000"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address (optional)
                  </label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="Street address"
                  />
                </div>
              </div>
            </section>

            {/* Physical Attributes */}
            <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-2 mr-3">
                  <Ruler className="w-6 h-6 text-white" />
                </div>
                Physical Attributes
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={profileData.age}
                    onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    value={profileData.height}
                    onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="170"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    value={profileData.weight}
                    onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bust Size</label>
                  <input
                    type="text"
                    value={profileData.bust_size}
                    onChange={(e) => setProfileData({ ...profileData, bust_size: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="B, C, D..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hair Color</label>
                  <select
                    value={profileData.hair_color}
                    onChange={(e) => setProfileData({ ...profileData, hair_color: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                  >
                    <option value="">Select...</option>
                    <option value="Blonde">Blonde</option>
                    <option value="Brown">Brown</option>
                    <option value="Black">Black</option>
                    <option value="Red">Red</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Eye Color</label>
                  <select
                    value={profileData.eye_color}
                    onChange={(e) => setProfileData({ ...profileData, eye_color: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                  >
                    <option value="">Select...</option>
                    <option value="Blue">Blue</option>
                    <option value="Brown">Brown</option>
                    <option value="Green">Green</option>
                    <option value="Hazel">Hazel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Body Type</label>
                  <select
                    value={profileData.body_type}
                    onChange={(e) => setProfileData({ ...profileData, body_type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                  >
                    <option value="">Select...</option>
                    <option value="Slim">Slim</option>
                    <option value="Athletic">Athletic</option>
                    <option value="Curvy">Curvy</option>
                    <option value="Average">Average</option>
                    <option value="BBW">BBW</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Services */}
            <section className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 mb-6 border border-pink-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Services Offered
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {servicesOptions.map((service) => (
                  <label
                    key={service}
                    className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 hover:border-pink-300 transition-all shadow-soft hover:shadow-md"
                  >
                    <input
                      type="checkbox"
                      checked={services.includes(service)}
                      onChange={() => toggleService(service)}
                      className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">{service}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Pricing */}
            <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 mb-6 border border-green-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-2 mr-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                Pricing
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Hour (CHF)
                  </label>
                  <input
                    type="number"
                    value={profileData.price_per_hour}
                    onChange={(e) => setProfileData({ ...profileData, price_per_hour: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Night (CHF)
                  </label>
                  <input
                    type="number"
                    value={profileData.price_per_night}
                    onChange={(e) => setProfileData({ ...profileData, price_per_night: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                    placeholder="1000"
                  />
                </div>
              </div>
            </section>

            {/* Working Hours */}
            <section className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 mb-6 border border-orange-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-2 mr-3">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                Working Hours
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <input
                  type="text"
                  value={profileData.working_hours}
                  onChange={(e) => setProfileData({ ...profileData, working_hours: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all shadow-soft hover:shadow-md"
                  placeholder="Mon-Fri 10:00-22:00 or 24/7 or Nach Vereinbarung"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Examples: "Mon-Fri 10:00-22:00", "24/7", "Nach Vereinbarung", "By appointment"
                </p>
              </div>
            </section>

            {/* Contact Preferences */}
            <section className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 mb-6 border border-indigo-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl p-2 mr-3">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                Contact Preferences
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-300 transition-all shadow-soft hover:shadow-md">
                  <input
                    type="checkbox"
                    checked={contactPrefs.prefers_sms}
                    onChange={(e) => setContactPrefs({ ...contactPrefs, prefers_sms: e.target.checked })}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">SMS</span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-300 transition-all shadow-soft hover:shadow-md">
                  <input
                    type="checkbox"
                    checked={contactPrefs.prefers_call}
                    onChange={(e) => setContactPrefs({ ...contactPrefs, prefers_call: e.target.checked })}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Call</span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-300 transition-all shadow-soft hover:shadow-md">
                  <input
                    type="checkbox"
                    checked={contactPrefs.prefers_whatsapp}
                    onChange={(e) => setContactPrefs({ ...contactPrefs, prefers_whatsapp: e.target.checked })}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">WhatsApp</span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 hover:border-indigo-300 transition-all shadow-soft hover:shadow-md">
                  <input
                    type="checkbox"
                    checked={contactPrefs.prefers_telegram}
                    onChange={(e) => setContactPrefs({ ...contactPrefs, prefers_telegram: e.target.checked })}
                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Telegram</span>
                </label>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex gap-4 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:border-gray-400 transition-all shadow-soft hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-medium"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

