'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import CompanySidebar from '@/components/layout/CompanySidebar'
import { Search, UserPlus, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

interface ModelSearchResult {
  id: string
  username: string
  is_verified: boolean
  profile_status: string
  showname?: string
  city?: string
  age?: number
}

export default function InviteModelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [allModels, setAllModels] = useState<ModelSearchResult[]>([])
  const [filteredModels, setFilteredModels] = useState<ModelSearchResult[]>([])
  const [excludedModelIds, setExcludedModelIds] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<ModelSearchResult | null>(null)
  const [inviteMessage, setInviteMessage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      
      // Load excluded model IDs (already connected or pending)
      await loadExcludedModels(user.id)
      
      // Load all models immediately
      await loadAllModels()
      
      setLoading(false)
    }

    checkUser()
  }, [router])

  const loadExcludedModels = async (clubId: string) => {
    try {
      const supabase = createClient()
      
      // Get all models with pending or accepted invites
      const { data: invites } = await supabase
        .from('club_invites')
        .select('invited_model_id')
        .eq('club_id', clubId)
        .in('status', ['pending', 'accepted'])
      
      if (invites) {
        setExcludedModelIds(invites.map(inv => inv.invited_model_id))
      }
    } catch (err: any) {
      console.error('Error loading excluded models:', err)
    }
  }

  const loadAllModels = async () => {
    try {
      const supabase = createClient()

      // Fetch all models
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          is_verified,
          profile_status
        `)
        .eq('role', 'model')
        .order('username', { ascending: true })

      console.log('Profiles query result:', { profiles, fetchError })

      if (fetchError) {
        console.error('Error fetching profiles:', fetchError)
        setError('Failed to load models. Please check console for details.')
        return
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found')
        setAllModels([])
        return
      }

      // Filter out excluded models
      const availableProfiles = profiles.filter(p => !excludedModelIds.includes(p.id))

      console.log(`Found ${availableProfiles.length} available models (${profiles.length} total)`)

      if (availableProfiles.length === 0) {
        setAllModels([])
        return
      }

      // Fetch additional model details
      const modelIds = availableProfiles.map(p => p.id)
      const { data: modelDetails, error: detailsError } = await supabase
        .from('model_details')
        .select('model_id, showname, city, age')
        .in('model_id', modelIds)

      console.log('Model details query result:', { modelDetails, detailsError })

      const detailsMap = new Map(modelDetails?.map(d => [d.model_id, d]) || [])

      const enrichedResults = availableProfiles.map(profile => ({
        ...profile,
        showname: detailsMap.get(profile.id)?.showname,
        city: detailsMap.get(profile.id)?.city,
        age: detailsMap.get(profile.id)?.age
      }))

      console.log('Enriched results:', enrichedResults)
      setAllModels(enrichedResults)
    } catch (err: any) {
      console.error('Error loading models:', err)
      setError('Failed to load models: ' + err.message)
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredModels([])
      setError('')
      return
    }

    // Filter models locally by username or showname
    const searchLower = query.toLowerCase()
    const filtered = allModels.filter(model => 
      model.username.toLowerCase().includes(searchLower) ||
      (model.showname && model.showname.toLowerCase().includes(searchLower))
    )

    setFilteredModels(filtered)
    
    if (filtered.length === 0 && query.trim()) {
      setError(`No models found matching "${query}"`)
    } else {
      setError('')
    }
  }

  // Helper function to check if model matches search
  const isMatchingSearch = (model: ModelSearchResult) => {
    if (!searchQuery.trim()) return false
    return filteredModels.some(m => m.id === model.id)
  }

  // Helper function to sort models - matching first
  const getSortedModels = () => {
    if (!searchQuery.trim() || filteredModels.length === 0) {
      return allModels
    }
    
    // Put matching models first, then the rest
    const matching = allModels.filter(m => filteredModels.some(f => f.id === m.id))
    const notMatching = allModels.filter(m => !filteredModels.some(f => f.id === m.id))
    
    return [...matching, ...notMatching]
  }

  const handleSendInvite = async () => {
    if (!selectedModel) return

    setError('')
    setSuccess('')
    setSending(true)

    try {
      const supabase = createClient()

      // Check if already invited or already part of club
      const { data: existingInvite } = await supabase
        .from('club_invites')
        .select('id, status')
        .eq('club_id', user.id)
        .eq('invited_model_id', selectedModel.id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle()

      if (existingInvite) {
        if (existingInvite.status === 'pending') {
          setError('You already have a pending invite for this model')
        } else {
          setError('This model is already part of your club')
        }
        setSending(false)
        return
      }

      // Create invite
      const { error: inviteError } = await supabase
        .from('club_invites')
        .insert({
          club_id: user.id,
          invited_model_id: selectedModel.id,
          message: inviteMessage.trim() || null,
          status: 'pending'
        })

      if (inviteError) throw inviteError

      setSuccess('Invitation sent successfully!')
      setSelectedModel(null)
      setInviteMessage('')
      setSearchQuery('')
      setFilteredModels([])
      
      // Refresh excluded models and available models
      await loadExcludedModels(user.id)
      await loadAllModels()
      
      setTimeout(() => {
        router.push('/dashboard/company/models')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <>
        <CompanySidebar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <CompanySidebar />
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/dashboard/company/models')}
              className="flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-4 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Manage Models
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Invite Model</h1>
            </div>
            <p className="text-gray-600">Search for a model and send them an invitation to join your club</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Search Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Search for Model</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    handleSearch(e.target.value)
                  }}
                  placeholder="Search by username or showname..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {searchQuery.trim() && filteredModels.length > 0
                ? `Showing ${filteredModels.length} of ${allModels.length} models`
                : `${allModels.length} model${allModels.length !== 1 ? 's' : ''} available`}
            </p>
          </div>

          {/* Models List */}
          {!selectedModel && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                All Models ({allModels.length})
                {searchQuery.trim() && filteredModels.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-purple-600">
                    - {filteredModels.length} match{filteredModels.length !== 1 ? 'ing' : 'es'} your search
                  </span>
                )}
              </h3>
              {allModels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No models available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {getSortedModels().map((model) => {
                    const isMatching = isMatchingSearch(model)
                    return (
                      <div
                        key={model.id}
                        className={`border-2 rounded-lg p-4 hover:border-purple-400 transition-all cursor-pointer ${
                          isMatching 
                            ? 'border-purple-300 bg-purple-50/50' 
                            : 'border-gray-200 bg-white'
                        }`}
                        onClick={() => setSelectedModel(model)}
                      >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                          {model.username?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        {/* Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {model.showname || model.username}
                            </h4>
                            {model.is_verified && (
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">@{model.username}</p>
                          {(model.age || model.city) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {model.age && `${model.age} years old`}
                              {model.age && model.city && ' • '}
                              {model.city}
                            </p>
                          )}
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200 transition-all">
                        Select
                      </button>
                    </div>
                  </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Selected Model - Send Invite */}
          {selectedModel && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Send Invitation</h3>
              
              {/* Selected Model Preview */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-2xl">
                    {selectedModel.username?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {selectedModel.showname || selectedModel.username}
                    </h4>
                    <p className="text-sm text-gray-600">@{selectedModel.username}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedModel(null)
                      setInviteMessage('')
                    }}
                    className="text-gray-500 hover:text-red-600 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Invite Message */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={4}
                  placeholder="Add a personal message to your invitation..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {inviteMessage.length} / 500 characters
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">What happens next?</p>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
                      <li>• The model will receive a notification</li>
                      <li>• They can accept or decline your invitation</li>
                      <li>• If accepted, they'll appear in your models list</li>
                      <li>• Models can be part of multiple clubs</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedModel(null)
                    setInviteMessage('')
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={sending}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-5 h-5" />
                  {sending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
