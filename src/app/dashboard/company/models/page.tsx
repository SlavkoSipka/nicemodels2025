'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Edit, Trash2, Eye, UserPlus, X, Clock, Users, CheckCircle } from 'lucide-react'

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
    const { error } = await supabase
      .from('club_invites')
      .delete()
      .eq('club_id', user.id)
      .eq('invited_model_id', modelId)
      .eq('status', 'accepted')

    if (error) {
      alert('Failed to remove model. Please try again.')
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
    } else {
      setInvites(invites.filter(i => i.id !== inviteId))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manage Models</h1>
              <p className="text-xs text-gray-500">View and manage your models & invitations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/company')}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => router.push('/dashboard/company/models/invite')}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
            >
              <UserPlus className="w-4 h-4" />
              Invite Model
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-gray-200 px-5">
            <button
              onClick={() => setActiveTab('models')}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'models'
                  ? 'text-brand border-b-2 border-brand -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Models
              <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'models' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-600'}`}>
                {models.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-4 py-3 text-sm font-semibold transition-colors relative ${
                activeTab === 'invites'
                  ? 'text-brand border-b-2 border-brand -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending Invites
              {invites.length > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${activeTab === 'invites' ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-700'}`}>
                  {invites.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-5">
            {/* Models Tab */}
            {activeTab === 'models' && (
              <>
                {models.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
                    <Users className="mx-auto w-10 h-10 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600 mt-2">No models yet</p>
                    <p className="text-xs text-gray-500 mt-0.5 mb-3">Invite models to join your club roster</p>
                    <button
                      onClick={() => router.push('/dashboard/company/models/invite')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Model
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {models.map((model) => (
                      <div
                        key={model.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                            {model.username?.charAt(0).toUpperCase() || 'M'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{model.username}</p>
                            <p className="text-xs text-gray-500 truncate">@{model.username}</p>
                          </div>
                          {model.is_verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 shrink-0">
                              <CheckCircle className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-500 text-xs font-semibold rounded-full border border-gray-200 shrink-0">
                              Unverified
                            </span>
                          )}
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => router.push(`/models/${model.username}`)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/company/models/${model.id}/edit`)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-brand/10 text-brand rounded-lg text-xs font-semibold hover:bg-brand/20 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(model.id)}
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Remove from club"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-lg">
                    <Clock className="mx-auto w-10 h-10 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600 mt-2">No pending invites</p>
                    <p className="text-xs text-gray-500 mt-0.5 mb-3">Invite models to join your club</p>
                    <button
                      onClick={() => router.push('/dashboard/company/models/invite')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Model
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div
                        key={invite.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm shrink-0">
                              {invite.model.username?.charAt(0).toUpperCase() || 'M'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{invite.model.username}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                                <span className="text-xs text-gray-400">
                                  Sent {new Date(invite.invited_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCancelInvite(invite.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors shrink-0"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                        {invite.message && (
                          <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-xs text-gray-600">
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
          </div>
        </div>

      </div>
    </div>
  )
}
