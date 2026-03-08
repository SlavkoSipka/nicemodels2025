'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Building2, Check, X, AlertCircle, CheckCircle, MapPin } from 'lucide-react'

interface ClubInvite {
  id: string; club_id: string; status: string; message: string | null; invited_at: string
  club_details: { club_name: string; display_name: string | null; area: string | null; about_description: string | null } | null
}

interface MyClub { club_id: string; club_name: string; display_name: string | null; area: string | null; city: string | null }

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
      if (!user) { router.push('/login'); return }

      const { data: invitesData, error: invitesError } = await supabase
        .from('club_invites').select('id, club_id, status, message, invited_at')
        .eq('invited_model_id', user.id).eq('status', 'pending').order('invited_at', { ascending: false })

      if (!invitesError && invitesData?.length) {
        const clubIds = invitesData.map(inv => inv.club_id)
        const { data: clubsData } = await supabase.from('club_details')
          .select('club_id, club_name, display_name, area, about_description').in('club_id', clubIds)
        const clubsMap = new Map(clubsData?.map(c => [c.club_id, c]) || [])
        setInvites(invitesData.map(invite => ({ ...invite, club_details: clubsMap.get(invite.club_id) || null })))
      }

      const { data: accepted } = await supabase.from('club_invites')
        .select('club_id').eq('invited_model_id', user.id).eq('status', 'accepted')
      if (accepted?.length) {
        const myClubIds = accepted.map(inv => inv.club_id)
        const { data: myClubsData } = await supabase.from('club_details')
          .select('club_id, club_name, display_name, area, city').in('club_id', myClubIds)
        setMyClubs(myClubsData || [])
      }
      setLoading(false)
    }
    loadInvites()
  }, [router])

  const handleRespond = async (inviteId: string, clubId: string, action: 'accept' | 'reject') => {
    setError(''); setSuccess(''); setResponding(inviteId)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error: e } = await supabase.from('club_invites').update({
        status: action === 'accept' ? 'accepted' : 'rejected', responded_at: new Date().toISOString()
      }).eq('id', inviteId)
      if (e) throw e
      await supabase.from('notifications').delete().eq('user_id', user.id).eq('related_entity_id', inviteId)
      setInvites(invites.filter(i => i.id !== inviteId))
      setSuccess(action === 'accept' ? 'Invitation accepted!' : 'Invitation declined')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to respond. Please try again.')
    } finally { setResponding(null) }
  }

  const tabBtn = (active: boolean) =>
    `px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${active ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'}`

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Clubs & Invitations</h1>
            <p className="text-xs text-gray-500">Manage your club memberships and pending invitations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button onClick={() => setActiveTab('invites')} className={tabBtn(activeTab === 'invites')}>
            Pending Invites
            {invites.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full">{invites.length}</span>}
          </button>
          <button onClick={() => setActiveTab('clubs')} className={tabBtn(activeTab === 'clubs')}>
            My Clubs
            <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full">{myClubs.length}</span>
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

        {/* Invites Tab */}
        {activeTab === 'invites' && (
          invites.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600 mb-1">No pending invitations</p>
              <p className="text-xs text-gray-400">You don't have any club invitations at the moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map(invite => (
                <div key={invite.id} className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/clubs/${invite.club_id}`} className="text-sm font-bold text-gray-900 hover:text-brand hover:underline transition-colors">
                        {invite.club_details?.display_name || invite.club_details?.club_name || 'Unknown Club'}
                      </Link>
                      {invite.club_details?.area && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{invite.club_details.area}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Invited {new Date(invite.invited_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {invite.club_details?.about_description && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 line-clamp-2">{invite.club_details.about_description?.replace(/<[^>]*>/g, '')}</p>
                    </div>
                  )}
                  {invite.message && (
                    <div className="mb-3 p-3 bg-brand/5 border border-brand/20 rounded-lg">
                      <p className="text-xs font-bold text-brand mb-0.5">Personal message:</p>
                      <p className="text-xs text-gray-700">{invite.message}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button onClick={() => handleRespond(invite.id, invite.club_id, 'accept')} disabled={responding === invite.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50">
                      <Check className="w-4 h-4" />{responding === invite.id ? 'Processing...' : 'Accept'}
                    </button>
                    <button onClick={() => handleRespond(invite.id, invite.club_id, 'reject')} disabled={responding === invite.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 disabled:opacity-50">
                      <X className="w-4 h-4" />Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* My Clubs Tab */}
        {activeTab === 'clubs' && (
          myClubs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600 mb-1">No clubs yet</p>
              <p className="text-xs text-gray-400">Accept an invitation to join a club</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {myClubs.map(club => (
                <div key={club.club_id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-brand/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-brand" />
                  </div>
                  <div>
                    <Link href={`/clubs/${club.club_id}`} className="text-sm font-bold text-gray-900 hover:text-brand hover:underline transition-colors">
                      {club.display_name || club.club_name}
                    </Link>
                    {(club.city || club.area) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />{club.city || club.area}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
