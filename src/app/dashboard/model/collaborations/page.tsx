'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Search, UserPlus, AlertCircle, CheckCircle, X, Check, Users, MapPin, Send, Inbox, Handshake } from 'lucide-react'

interface ModelSearchResult {
  id: string
  username: string
  is_verified: boolean
  showname?: string
  city?: string
  age?: number
  photoUrl?: string | null
}

interface CollabInvite {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  message: string | null
  created_at: string
  model?: ModelSearchResult
}

type TabType = 'incoming' | 'sent' | 'collaborations' | 'invite'

export default function ModelCollaborationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<TabType>('collaborations')

  const [incomingInvites, setIncomingInvites] = useState<CollabInvite[]>([])
  const [sentInvites, setSentInvites] = useState<CollabInvite[]>([])
  const [collaborations, setCollaborations] = useState<CollabInvite[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [allModels, setAllModels] = useState<ModelSearchResult[]>([])
  const [filteredModels, setFilteredModels] = useState<ModelSearchResult[]>([])
  const [excludedModelIds, setExcludedModelIds] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<ModelSearchResult | null>(null)
  const [inviteMessage, setInviteMessage] = useState('')

  const [responding, setResponding] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadData()
  }, [router])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    await Promise.all([
      loadIncoming(user.id),
      loadSent(user.id),
      loadCollaborations(user.id),
      loadExcluded(user.id),
    ])

    await loadAllModels(user.id)
    setLoading(false)
  }

  const loadIncoming = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('model_collaborations')
      .select('id, sender_id, receiver_id, status, message, created_at')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (data?.length) {
      const modelIds = data.map(d => d.sender_id)
      const enriched = await enrichModels(modelIds, data, 'sender_id')
      setIncomingInvites(enriched)
    } else {
      setIncomingInvites([])
    }
  }

  const loadSent = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('model_collaborations')
      .select('id, sender_id, receiver_id, status, message, created_at')
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (data?.length) {
      const modelIds = data.map(d => d.receiver_id)
      const enriched = await enrichModels(modelIds, data, 'receiver_id')
      setSentInvites(enriched)
    } else {
      setSentInvites([])
    }
  }

  const loadCollaborations = async (userId: string) => {
    const supabase = createClient()

    const { data: asSender } = await supabase
      .from('model_collaborations')
      .select('id, sender_id, receiver_id, status, message, created_at')
      .eq('sender_id', userId)
      .eq('status', 'accepted')

    const { data: asReceiver } = await supabase
      .from('model_collaborations')
      .select('id, sender_id, receiver_id, status, message, created_at')
      .eq('receiver_id', userId)
      .eq('status', 'accepted')

    const all = [...(asSender || []), ...(asReceiver || [])]
    if (all.length) {
      const partnerIds = all.map(c => c.sender_id === userId ? c.receiver_id : c.sender_id)
      const enriched = await enrichModelsGeneric(partnerIds, all, userId)
      setCollaborations(enriched)
    } else {
      setCollaborations([])
    }
  }

  const enrichModels = async (modelIds: string[], items: any[], idField: string) => {
    const supabase = createClient()
    const [{ data: profiles }, { data: details }, { data: photos }] = await Promise.all([
      supabase.from('profiles').select('id, username, is_verified').in('id', modelIds),
      supabase.from('model_details').select('model_id, showname, city, age').in('model_id', modelIds),
      supabase.from('model_photos').select('model_id, file_path').in('model_id', modelIds).eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])

    const detailsMap = new Map((details || []).map(d => [d.model_id, d]))
    const photosMap = new Map<string, string>()
    for (const p of (photos || [])) {
      if (!photosMap.has(p.model_id) && p.file_path) {
        photosMap.set(p.model_id, `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }
    const profilesMap = new Map((profiles || []).map(p => [p.id, p]))

    return items.map(item => {
      const mid = item[idField]
      const prof = profilesMap.get(mid)
      const det = detailsMap.get(mid)
      return {
        ...item,
        model: prof ? {
          id: prof.id,
          username: prof.username,
          is_verified: prof.is_verified,
          showname: det?.showname,
          city: det?.city,
          age: det?.age,
          photoUrl: photosMap.get(mid) || null,
        } : undefined,
      }
    })
  }

  const enrichModelsGeneric = async (partnerIds: string[], items: any[], currentUserId: string) => {
    const supabase = createClient()
    const [{ data: profiles }, { data: details }, { data: photos }] = await Promise.all([
      supabase.from('profiles').select('id, username, is_verified').in('id', partnerIds),
      supabase.from('model_details').select('model_id, showname, city, age').in('model_id', partnerIds),
      supabase.from('model_photos').select('model_id, file_path').in('model_id', partnerIds).eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])

    const detailsMap = new Map((details || []).map(d => [d.model_id, d]))
    const photosMap = new Map<string, string>()
    for (const p of (photos || [])) {
      if (!photosMap.has(p.model_id) && p.file_path) {
        photosMap.set(p.model_id, `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }
    const profilesMap = new Map((profiles || []).map(p => [p.id, p]))

    return items.map(item => {
      const mid = item.sender_id === currentUserId ? item.receiver_id : item.sender_id
      const prof = profilesMap.get(mid)
      const det = detailsMap.get(mid)
      return {
        ...item,
        model: prof ? {
          id: prof.id,
          username: prof.username,
          is_verified: prof.is_verified,
          showname: det?.showname,
          city: det?.city,
          age: det?.age,
          photoUrl: photosMap.get(mid) || null,
        } : undefined,
      }
    })
  }

  const loadExcluded = async (userId: string) => {
    const supabase = createClient()
    const { data: sent } = await supabase
      .from('model_collaborations')
      .select('receiver_id')
      .eq('sender_id', userId)
      .in('status', ['pending', 'accepted'])

    const { data: received } = await supabase
      .from('model_collaborations')
      .select('sender_id')
      .eq('receiver_id', userId)
      .in('status', ['pending', 'accepted'])

    const ids = [
      ...(sent || []).map(s => s.receiver_id),
      ...(received || []).map(r => r.sender_id),
      userId,
    ]
    setExcludedModelIds(ids)
    return ids
  }

  const loadAllModels = async (userId: string) => {
    const supabase = createClient()
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, is_verified')
      .eq('role', 'model')
      .order('username', { ascending: true })

    if (!profiles?.length) { setAllModels([]); return }

    const modelIds = profiles.map(p => p.id)
    const [{ data: details }, { data: photos }] = await Promise.all([
      supabase.from('model_details').select('model_id, showname, city, age').in('model_id', modelIds),
      supabase.from('model_photos').select('model_id, file_path').in('model_id', modelIds).eq('is_approved', true).order('uploaded_at', { ascending: false }),
    ])

    const detailsMap = new Map((details || []).map(d => [d.model_id, d]))
    const photosMap = new Map<string, string>()
    for (const p of (photos || [])) {
      if (!photosMap.has(p.model_id) && p.file_path) {
        photosMap.set(p.model_id, `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }

    setAllModels(profiles.map(p => ({
      id: p.id,
      username: p.username,
      is_verified: p.is_verified,
      showname: detailsMap.get(p.id)?.showname,
      city: detailsMap.get(p.id)?.city,
      age: detailsMap.get(p.id)?.age,
      photoUrl: photosMap.get(p.id) || null,
    })))
  }

  const getAvailableModels = () => {
    return allModels.filter(m => !excludedModelIds.includes(m.id))
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) { setFilteredModels([]); return }
    const q = query.toLowerCase()
    const available = getAvailableModels()
    setFilteredModels(available.filter(m =>
      m.username.toLowerCase().includes(q) ||
      (m.showname && m.showname.toLowerCase().includes(q)) ||
      (m.city && m.city.toLowerCase().includes(q))
    ))
  }

  const countAcceptedCollabs = async (supabase: any, userId: string): Promise<number> => {
    const [{ data: asSender }, { data: asReceiver }] = await Promise.all([
      supabase.from('model_collaborations').select('id').eq('sender_id', userId).eq('status', 'accepted'),
      supabase.from('model_collaborations').select('id').eq('receiver_id', userId).eq('status', 'accepted'),
    ])
    return (asSender?.length || 0) + (asReceiver?.length || 0)
  }

  const handleSendInvite = async () => {
    if (!selectedModel || !user) return
    setError(''); setSuccess(''); setSending(true)

    try {
      const supabase = createClient()

      const { data: existing } = await supabase
        .from('model_collaborations')
        .select('id, status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedModel.id}),and(sender_id.eq.${selectedModel.id},receiver_id.eq.${user.id})`)
        .in('status', ['pending', 'accepted'])
        .maybeSingle()

      if (existing) {
        setError(existing.status === 'pending'
          ? 'There is already a pending collaboration request with this model.'
          : 'You already have an active collaboration with this model.')
        setSending(false)
        return
      }

      // Enforce 2-collaboration limit for both sides
      const [senderCount, receiverCount] = await Promise.all([
        countAcceptedCollabs(supabase, user.id),
        countAcceptedCollabs(supabase, selectedModel.id),
      ])

      if (senderCount >= 2) {
        setError('You already have 2 collaborations. Remove one first to add a new one.')
        setSending(false)
        return
      }
      if (receiverCount >= 2) {
        setError('This model already has 2 collaborations and cannot accept more at this time.')
        setSending(false)
        return
      }

      const { error: insertError } = await supabase
        .from('model_collaborations')
        .insert({
          sender_id: user.id,
          receiver_id: selectedModel.id,
          message: inviteMessage.trim() || null,
          status: 'pending',
        })

      if (insertError) throw insertError

      setSuccess('Collaboration request sent!')
      setSelectedModel(null)
      setInviteMessage('')
      setSearchQuery('')
      setFilteredModels([])

      await Promise.all([
        loadSent(user.id),
        loadExcluded(user.id),
      ])
      await loadAllModels(user.id)

      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message || 'Failed to send request.')
    } finally { setSending(false) }
  }

  const handleRespond = async (inviteId: string, action: 'accept' | 'reject') => {
    if (!user) return
    setError(''); setSuccess(''); setResponding(inviteId)

    try {
      const supabase = createClient()

      // Before accepting, check that neither side exceeds the 2-collab limit
      if (action === 'accept') {
        const invite = incomingInvites.find(i => i.id === inviteId)
        if (invite) {
          const [receiverCount, senderCount] = await Promise.all([
            countAcceptedCollabs(supabase, user.id),
            countAcceptedCollabs(supabase, invite.sender_id),
          ])
          if (receiverCount >= 2) {
            setError('You already have 2 collaborations. Remove one first to accept this request.')
            setResponding(null)
            return
          }
          if (senderCount >= 2) {
            setError('The model who sent this request already has 2 collaborations.')
            setResponding(null)
            return
          }
        }
      }

      const { error: e } = await supabase
        .from('model_collaborations')
        .update({
          status: action === 'accept' ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', inviteId)

      if (e) throw e

      await supabase.from('notifications').delete().eq('user_id', user.id).eq('related_entity_id', inviteId)

      setSuccess(action === 'accept' ? 'Collaboration accepted!' : 'Request declined.')
      await Promise.all([
        loadIncoming(user.id),
        loadCollaborations(user.id),
        loadExcluded(user.id),
      ])
      await loadAllModels(user.id)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to respond.')
    } finally { setResponding(null) }
  }

  const handleCancelSent = async (inviteId: string) => {
    if (!user || !confirm('Cancel this collaboration request?')) return
    setError('')

    try {
      const supabase = createClient()
      const { error: e } = await supabase
        .from('model_collaborations')
        .update({ status: 'cancelled' })
        .eq('id', inviteId)

      if (e) throw e

      setSuccess('Request cancelled.')
      await Promise.all([
        loadSent(user.id),
        loadExcluded(user.id),
      ])
      await loadAllModels(user.id)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to cancel.')
    }
  }

  const handleRemoveCollab = async (collabId: string) => {
    if (!user || !confirm('Remove this collaboration? Both profiles will no longer show each other.')) return
    setError('')

    try {
      const supabase = createClient()
      const { error: e } = await supabase
        .from('model_collaborations')
        .delete()
        .eq('id', collabId)

      if (e) throw e

      setSuccess('Collaboration removed.')
      await Promise.all([
        loadCollaborations(user.id),
        loadExcluded(user.id),
      ])
      await loadAllModels(user.id)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to remove.')
    }
  }

  const tabBtn = (tab: TabType, count?: number) => {
    const active = activeTab === tab
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
          active ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        {tab === 'collaborations' && 'My Collaborations'}
        {tab === 'incoming' && 'Incoming'}
        {tab === 'sent' && 'Sent'}
        {tab === 'invite' && 'Invite Model'}
        {count !== undefined && count > 0 && (
          <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full ${
            active ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-600'
          }`}>{count}</span>
        )}
      </button>
    )
  }

  const ModelCard = ({ model, photoUrl }: { model: ModelSearchResult; photoUrl?: string | null }) => (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-11 h-11 rounded-full overflow-hidden bg-brand/10 flex items-center justify-center shrink-0">
        {(photoUrl || model.photoUrl) ? (
          <Image
            src={photoUrl || model.photoUrl!}
            alt={model.showname || model.username}
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-brand font-bold text-sm">{model.username?.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <Link href={`/models/${model.id}`} className="text-sm font-semibold text-gray-900 truncate hover:text-brand transition-colors">
            {model.showname || model.username}
          </Link>
          {model.is_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
        </div>
        <p className="text-xs text-gray-500 truncate">
          @{model.username}
          {(model.age || model.city) && (
            <span className="ml-1">· {[model.age ? `${model.age}y` : '', model.city].filter(Boolean).join(' · ')}</span>
          )}
        </p>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-0 md:ml-[280px]">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <Handshake className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Collaborations</h1>
            <p className="text-xs text-gray-500">Manage your model collaborations and partnership requests</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
          {tabBtn('collaborations', collaborations.length)}
          {tabBtn('incoming', incomingInvites.length)}
          {tabBtn('sent', sentInvites.length)}
          {tabBtn('invite')}
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

        {/* ── My Collaborations Tab ── */}
        {activeTab === 'collaborations' && (
          collaborations.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600 mb-1">No collaborations yet</p>
              <p className="text-xs text-gray-400 mb-4">Send a collaboration request to another model to get started</p>
              <button onClick={() => setActiveTab('invite')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors">
                <UserPlus className="w-4 h-4" /> Invite a Model
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {collaborations.map(collab => collab.model && (
                <div key={collab.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <ModelCard model={collab.model} />
                    <button
                      onClick={() => handleRemoveCollab(collab.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
                      title="Remove collaboration"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Incoming Invites Tab ── */}
        {activeTab === 'incoming' && (
          incomingInvites.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600 mb-1">No incoming requests</p>
              <p className="text-xs text-gray-400">You don't have any pending collaboration requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingInvites.map(invite => invite.model && (
                <div key={invite.id} className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <ModelCard model={invite.model} />
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    Received {new Date(invite.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  {invite.message && (
                    <div className="mb-3 p-3 bg-brand/5 border border-brand/20 rounded-lg">
                      <p className="text-xs font-bold text-brand mb-0.5">Personal message:</p>
                      <p className="text-xs text-gray-700">{invite.message}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleRespond(invite.id, 'accept')}
                      disabled={responding === invite.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />{responding === invite.id ? 'Processing...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleRespond(invite.id, 'reject')}
                      disabled={responding === invite.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Sent Invites Tab ── */}
        {activeTab === 'sent' && (
          sentInvites.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
              <Send className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600 mb-1">No pending sent requests</p>
              <p className="text-xs text-gray-400 mb-4">All your sent requests have been responded to</p>
              <button onClick={() => setActiveTab('invite')} className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors">
                <UserPlus className="w-4 h-4" /> Invite a Model
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sentInvites.map(invite => invite.model && (
                <div key={invite.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <ModelCard model={invite.model} />
                    <p className="text-xs text-gray-400 mt-1 ml-14">
                      Sent {new Date(invite.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelSent(invite.id)}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors shrink-0"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Invite Model Tab ── */}
        {activeTab === 'invite' && (
          <>
            {/* Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search models by name or city..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {searchQuery.trim()
                  ? `${filteredModels.length} model${filteredModels.length !== 1 ? 's' : ''} found`
                  : `${getAvailableModels().length} model${getAvailableModels().length !== 1 ? 's' : ''} available`
                }
              </p>
            </div>

            {/* Selected model - send panel */}
            {selectedModel && (
              <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
                <p className="text-sm font-bold text-gray-800">Send Collaboration Request</p>
                <div className="flex items-center justify-between p-3 bg-brand/5 border border-brand/20 rounded-lg">
                  <ModelCard model={selectedModel} />
                  <button onClick={() => { setSelectedModel(null); setInviteMessage('') }} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Personal Message <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    placeholder="Add a message to your collaboration request..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-0.5 text-right">{inviteMessage.length} / 500</p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-700 mb-1">What happens next?</p>
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    <li>· The model will receive a notification</li>
                    <li>· They can accept or decline your request</li>
                    <li>· If accepted, you'll appear on each other's profiles</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button onClick={() => { setSelectedModel(null); setInviteMessage('') }} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                    Cancel
                  </button>
                  <button
                    onClick={handleSendInvite}
                    disabled={sending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            )}

            {/* Models list */}
            {!selectedModel && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-bold text-gray-800 mb-3">
                  {searchQuery.trim() ? 'Search Results' : 'Available Models'}
                </p>
                {(() => {
                  const modelsToShow = searchQuery.trim() ? filteredModels : getAvailableModels()
                  if (modelsToShow.length === 0) return (
                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500">
                        {searchQuery.trim() ? `No models found matching "${searchQuery}"` : 'No models available'}
                      </p>
                    </div>
                  )
                  return (
                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                      {modelsToShow.map(model => (
                        <div
                          key={model.id}
                          onClick={() => setSelectedModel(model)}
                          className="flex items-center justify-between border border-gray-200 hover:border-brand/40 hover:bg-brand/5 rounded-lg p-3 cursor-pointer transition-all"
                        >
                          <ModelCard model={model} />
                          <span className="text-xs font-semibold text-brand bg-brand/10 px-2.5 py-1 rounded-lg shrink-0 ml-2">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
