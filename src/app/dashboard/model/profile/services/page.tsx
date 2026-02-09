'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ServicesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const [sexualOrientation, setSexualOrientation] = useState('')
  const [servicesFor, setServicesFor] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [allServices, setAllServices] = useState<any[]>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

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

        // Load services from database
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .order('category')
          .order('name')

        if (servicesData) setAllServices(servicesData)

        // Load model details
        const { data: modelDetails } = await supabase
          .from('model_details')
          .select('*')
          .eq('model_id', user.id)
          .single()

        if (modelDetails) {
          setSexualOrientation(modelDetails.sexual_orientation || '')
          setServicesFor(modelDetails.services_for || [])
        }

        // Load selected services
        const { data: modelServicesData } = await supabase
          .from('model_services')
          .select('service_id')
          .eq('model_id', user.id)

        if (modelServicesData) {
          setSelectedServices(modelServicesData.map(s => s.service_id))
        }

        setLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const toggleServiceFor = (option: string) => {
    setServicesFor(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    )
  }

  const toggleService = (serviceId: number) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    )
  }

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => prev === category ? null : category)
  }

  const getServicesByCategory = (category: string) => {
    return allServices.filter(s => s.category === category)
  }

  const getSelectedCountByCategory = (category: string) => {
    const categoryServices = getServicesByCategory(category)
    return categoryServices.filter(s => selectedServices.includes(s.id)).length
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'main': 'Main Services',
      'extra': 'Extra Services',
      'fetish_bizarre': 'Fetish / Bizarre',
      'virtual': 'Virtual Services',
      'massage': 'Massage services without sex!'
    }
    return labels[category] || category
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const supabase = createClient()

      // Update model details
      const { error: detailsError } = await supabase
        .from('model_details')
        .upsert({
          model_id: user.id,
          sexual_orientation: sexualOrientation || null,
          services_for: servicesFor.length > 0 ? servicesFor : null,
        }, { onConflict: 'model_id' })

      if (detailsError) throw detailsError

      // Delete existing services
      await supabase.from('model_services').delete().eq('model_id', user.id)

      // Insert selected services
      if (selectedServices.length > 0) {
        const { error: servicesError } = await supabase
          .from('model_services')
          .insert(selectedServices.map(serviceId => ({
            model_id: user.id,
            service_id: serviceId
          })))

        if (servicesError) throw servicesError
      }

      alert('Services updated successfully!')
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
                Services
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
            {/* Sexual Orientation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sexual Orientation
              </label>
              <select
                value={sexualOrientation}
                onChange={(e) => setSexualOrientation(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Sexual Orientation</option>
                <option value="heterosexual">Heterosexual</option>
                <option value="bisexual">Bisexual</option>
                <option value="homosexual">Homosexual</option>
              </select>
            </div>

            {/* Services Offered For */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Services Offered For
              </label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { value: 'men', label: 'Men' },
                  { value: 'women', label: 'Women' },
                  { value: 'couples', label: 'Couples' },
                  { value: 'trans', label: 'Trans' },
                  { value: 'gays', label: 'Gays' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleServiceFor(option.value)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                      servicesFor.includes(option.value)
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Services
              </label>
              
              <div className="space-y-3">
                {['main', 'extra', 'fetish_bizarre', 'virtual', 'massage'].map(category => {
                  const categoryServices = getServicesByCategory(category)
                  const isExpanded = expandedCategory === category
                  const selectedCount = getSelectedCountByCategory(category)
                  const totalCount = categoryServices.length

                  return (
                    <div key={category} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-pink-600">
                            {getCategoryLabel(category)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {selectedCount}/{totalCount}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>

                      {/* Category Services */}
                      {isExpanded && (
                        <div className="p-4 bg-white grid grid-cols-2 gap-3">
                          {categoryServices.map(service => (
                            <label
                              key={service.id}
                              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-pink-50 transition-all"
                            >
                              <input
                                type="checkbox"
                                checked={selectedServices.includes(service.id)}
                                onChange={() => toggleService(service.id)}
                                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                              />
                              <span className="text-sm">{service.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
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
