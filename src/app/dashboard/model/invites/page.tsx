'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import { Building2, Check, X, AlertCircle, CheckCircle } from 'lucide-react'

interface ClubInvite {
  id: string
  club_id: string
  status: string
  message: string | null
  invited_at: string
  club_details: {
    club_name: string
    display_name: string | null
    area: string | null
    about_description: string | null
  } | null
}

interface MyClub {
  club_id: string
  club_name: string
  display_name: string | null
  area: string | null
  city: string | null
}

type TabType = 'invites' | 'clubs'

export default function ModelInvitesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<string | null>(null)
  const [invites, setInvites] = useState<ClubInvite[]>([])
  const [myClubs, setMyClubs] = useState<MyClub[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('invites')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadInvites = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('club_invites')
        .select(`
          id,
          club_id,
          status,
          message,
          invited_at
        `)
        .eq('invited_model_id', user.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false })

      if (invitesError) {
        console.error('Error loading invites:', invitesError)
        setLoading(false)
        return
      }

      // Fetch club details separately
      if (invitesData && invitesData.length > 0) {
        const clubIds = invitesData.map(inv => inv.club_id)
        const { data: clubsData } = await supabase
          .from('club_details')
          .select('club_id, club_name, display_name, area, about_description')
          .in('club_id', clubIds)

        const clubsMap = new Map(clubsData?.map(c => [c.club_id, c]) || [])

        const enrichedInvites = invitesData.map(invite => ({
          ...invite,
          club_details: clubsMap.get(invite.club_id) || null
        }))

        setInvites(enrichedInvites)
      }

      // Fetch my clubs (accepted invites)
      const { data: acceptedInvites } = await supabase
        .from('club_invites')
        .select('club_id')
        .eq('invited_model_id', user.id)
        .eq('status', 'accepted')

      if (acceptedInvites && acceptedInvites.length > 0) {
        const myClubIds = acceptedInvites.map(inv => inv.club_id)
        const { data: myClubsData } = await supabase
          .from('club_details')
          .select('club_id, club_name, display_name, area, city')
          .in('club_id', myClubIds)

        setMyClubs(myClubsData || [])
      }

      setLoading(false)
    }

    loadInvites()
  }, [router])

  const handleRespond = async (inviteId: string, clubId: string, action: 'accept' | 'reject') => {
    setError('')
    setSuccess('')
    setResponding(inviteId)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Update invite status
      const { error: inviteError } = await supabase
        .from('club_invites')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString()
        })
        .eq('id', inviteId)

      if (inviteError) throw inviteError

      // Delete related notification
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('related_entity_id', inviteId)

      setInvites(invites.filter(i => i.id !== inviteId))
      setSuccess(action === 'accept' ? 'Invitation accepted!' : 'Invitation declined')
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to respond. Please try again.')
    } finally {
      setResponding(null)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardSidebar userRole="model" />
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
      <DashboardSidebar userRole="model" />
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 rounded-lg p-2">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Clubs & Invitations</h1>
            </div>
            <p className="text-gray-600">Manage your club memberships and pending invitations</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
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
            <button
              onClick={() => setActiveTab('clubs')}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'clubs'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Clubs
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                {myClubs.length}
              </span>
            </button>
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

          {/* Invites Tab */}
          {activeTab === 'invites' && (
            <>
              {invites.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Building2 className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending invitations</h3>
              <p className="text-gray-600">You don't have any club invitations at the moment</p>
            </div>
          ) : (
            <div className="space-y-6">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6"
                >
                  {/* Club Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-3 text-white">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        Club: {invite.club_details?.display_name || invite.club_details?.club_name || 'Unknown'}
                      </h3>
                      {invite.club_details?.area && (
                        <p className="text-sm text-gray-600 mt-1">
                          📍 {invite.club_details.area}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Invited {new Date(invite.invited_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* About Club */}
                  {invite.club_details?.about_description && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {invite.club_details.about_description}
                      </p>
                    </div>
                  )}

                  {/* Personal Message */}
                  {invite.message && (
                    <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm font-semibold text-purple-900 mb-1">Personal message:</p>
                      <p className="text-sm text-purple-800">{invite.message}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleRespond(invite.id, invite.club_id, 'accept')}
                      disabled={responding === invite.id}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                      {responding === invite.id ? 'Processing...' : 'Accept Invitation'}
                    </button>
                    <button
                      onClick={() => handleRespond(invite.id, invite.club_id, 'reject')}
                      disabled={responding === invite.id}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                    >
                      <X className="w-5 h-5" />
                      Decline
                    </button>
                  </div>

                  {/* Info Note */}
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    💡 You can be part of multiple clubs at the same time
                  </p>
                </div>
              ))}
            </div>
              )}
            </>
          )}

          {/* My Clubs Tab */}
          {activeTab === 'clubs' && (
            <>
              {myClubs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Building2 className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No clubs yet</h3>
                  <p className="text-gray-600">Accept an invitation to join a club</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myClubs.map((club) => (
                    <div
                      key={club.club_id}
                      className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6 hover:border-purple-300 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-3 text-white">
                          <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {club.display_name || club.club_name}
                          </h3>
                          {(club.city || club.area) && (
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              📍 {club.city || club.area}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
