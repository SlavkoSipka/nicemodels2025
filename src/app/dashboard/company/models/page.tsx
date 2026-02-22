'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Edit, Trash2, Eye, UserPlus, X, Clock } from 'lucide-react'

interface Model {
  id: string
  username: string
  is_verified: boolean
  created_at: string
}

interface Invite {
  id: string
  invited_model_id: string
  status: string
  message: string | null
  invited_at: string
  model: {
    username: string
  }
}

type TabType = 'models' | 'invites'

export default function ManageModelsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<Model[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('models')

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Fetch models via accepted invites
      const { data: acceptedInvites } = await supabase
        .from('club_invites')
        .select('invited_model_id')
        .eq('club_id', user.id)
        .eq('status', 'accepted')

      if (acceptedInvites && acceptedInvites.length > 0) {
        const modelIds = acceptedInvites.map(inv => inv.invited_model_id)
        const { data: modelProfiles } = await supabase
          .from('profiles')
          .select('id, username, is_verified, created_at')
          .in('id', modelIds)
          .order('created_at', { ascending: false })

        setModels(modelProfiles || [])
      }

      // Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('club_invites')
        .select(`
          id,
          invited_model_id,
          status,
          message,
          invited_at,
          model:profiles!club_invites_invited_model_id_fkey(username)
        `)
        .eq('club_id', user.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false })

      if (!invitesError && invitesData) {
        setInvites(invitesData.map(invite => ({
          ...invite,
          model: Array.isArray(invite.model) ? invite.model[0] : invite.model
        })))
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleDelete = async (modelId: string) => {
    if (!confirm('Are you sure you want to remove this model from your club?')) return

    const supabase = createClient()
    
    // Delete accepted invite
    const { error } = await supabase
      .from('club_invites')
      .delete()
      .eq('club_id', user.id)
      .eq('invited_model_id', modelId)
      .eq('status', 'accepted')

    if (error) {
      alert('Failed to remove model. Please try again.')
      console.error('Remove error:', error)
    } else {
      setModels(models.filter(m => m.id !== modelId))
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Cancel this invitation?')) return

    const supabase = createClient()
    
    const { error } = await supabase
      .from('club_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId)

    if (error) {
      alert('Failed to cancel invite. Please try again.')
      console.error('Cancel error:', error)
    } else {
      setInvites(invites.filter(i => i.id !== inviteId))
    }
  }

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 ml-[280px]">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Models</h1>
                <p className="text-gray-600">View and manage your models & invitations</p>
              </div>
              <button
                onClick={() => router.push('/dashboard/company/models/invite')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
              >
                <UserPlus size={20} />
                Invite Model
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('models')}
                className={`px-6 py-3 font-semibold transition-all relative ${
                  activeTab === 'models'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Models
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {models.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`px-6 py-3 font-semibold transition-all relative ${
                  activeTab === 'invites'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Invites
                {invites.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    {invites.length}
                  </span>
                )}
              </button>
            </div>

            {/* Models Tab */}
            {activeTab === 'models' && (
              <>
                {models.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No models yet</h3>
                <p className="text-gray-600 mb-4">Invite models to join your club roster</p>
                <button
                  onClick={() => router.push('/dashboard/company/models/invite')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  <UserPlus size={20} />
                  Invite Model
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-pink-300 transition-all"
                  >
                    {/* Avatar */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-xl">
                        {model.username?.charAt(0).toUpperCase() || 'M'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{model.username}</h3>
                        <p className="text-sm text-gray-600">@{model.username}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                      {model.is_verified ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/models/${model.username}`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/company/models/${model.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg font-semibold hover:bg-pink-200 transition-all"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                        title="Remove from club"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}

            {/* Invites Tab */}
            {activeTab === 'invites' && (
              <>
                {invites.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-gray-400 mb-4">
                      <Clock className="mx-auto h-12 w-12" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending invites</h3>
                    <p className="text-gray-600 mb-4">Invite models to join your club</p>
                    <button
                      onClick={() => router.push('/dashboard/company/models/invite')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      <UserPlus size={20} />
                      Invite Model
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="border-2 border-gray-200 rounded-lg p-6 hover:border-yellow-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
                              {invite.model.username?.charAt(0).toUpperCase() || 'M'}
                            </div>
                            {/* Info */}
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {invite.model.username}
                              </h3>
                              <p className="text-sm text-gray-600">@{invite.model.username}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </span>
                                <span className="text-xs text-gray-500">
                                  Sent {new Date(invite.invited_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <button
                            onClick={() => handleCancelInvite(invite.id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all flex items-center gap-2"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </div>

                        {/* Message */}
                        {invite.message && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Message:</span> {invite.message}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Back Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/dashboard/company')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}

