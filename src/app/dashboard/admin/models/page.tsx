'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Ban, CheckCircle, Mail, Calendar, User } from 'lucide-react'
import PhotoGalleryModal from '@/components/admin/PhotoGalleryModal'

interface Model {
  id: string
  email: string
  username: string
  created_at: string
  is_blocked: boolean
  onboarding_completed: boolean
  is_verified: boolean
  model_details?: {
    showname: string
    city: string
  }
}

export default function AdminModelsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<Model[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    // Load all models
    const { data: modelsData, error } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        username,
        created_at,
        is_blocked,
        onboarding_completed,
        is_verified,
        model_details!model_details_model_id_fkey (
          showname,
          city
        )
      `)
      .eq('role', 'model')
      .order('created_at', { ascending: false })

    if (error) {
      alert('Error loading models: ' + error.message)
      setLoading(false)
      return
    }

    // Transform the data to handle model_details as object instead of array
    const transformedModels = modelsData?.map(model => ({
      ...model,
      model_details: Array.isArray(model.model_details) 
        ? model.model_details[0] 
        : model.model_details
    })) || []

    setModels(transformedModels)
    setLoading(false)
  }

  const handleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    if (!confirm(`Are you sure you want to ${currentlyBlocked ? 'unblock' : 'block'} this user?`)) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        is_blocked: !currentlyBlocked,
        blocked_at: !currentlyBlocked ? new Date().toISOString() : null,
      })
      .eq('id', userId)

    if (error) {
      alert('Failed to update user status')
      return
    }

    // Refresh list
    loadModels()
  }

  const filteredModels = models.filter(model =>
    model.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.model_details?.showname?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/admin" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Models Management</h1>
          <p className="text-gray-600">Total Models: {models.length}</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by email, username, or showname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>

        {/* Models List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {model.model_details?.showname || model.username || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">@{model.username || 'no-username'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {model.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {model.model_details?.city || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(model.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {model.is_verified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {model.is_blocked ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Ban className="w-3 h-3 mr-1" />
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                        {!model.onboarding_completed && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Incomplete
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedModel(model)
                            setShowPhotoModal(true)
                          }}
                          className="px-3 py-1 text-sm rounded-lg font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
                        >
                          Photos
                        </button>
                        <button
                          onClick={() => handleBlockUser(model.id, model.is_blocked)}
                          className={`px-3 py-1 text-sm rounded-lg font-semibold transition-all ${
                            model.is_blocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {model.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No models found</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {selectedModel && (
        <PhotoGalleryModal
          isOpen={showPhotoModal}
          onClose={() => {
            setShowPhotoModal(false)
            setSelectedModel(null)
          }}
          profileId={selectedModel.id}
          profileName={selectedModel.model_details?.showname || selectedModel.username || 'Model'}
          profileType="model"
        />
      )}
    </div>
  )
}
