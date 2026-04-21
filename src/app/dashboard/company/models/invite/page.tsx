'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search, UserPlus, AlertCircle, CheckCircle, ArrowLeft, X, Zap } from 'lucide-react'

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
  const [hasActiveAd, setHasActiveAd] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      const adActive = await checkActiveAd(user.id)
      if (adActive) {
        await loadExcludedModels(user.id)
        await loadAllModels()
      }
      setLoading(false)
    }

    checkUser()
  }, [router])

  const checkActiveAd = async (userId: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('order_items')
        .select(`
          id,
          activation_date,
          orders!inner(user_id, status, created_at),
          products!inner(product_type, duration_days, duration_hours)
        `)
        .eq('orders.user_id', userId)
        .eq('orders.status', 'paid')
        .eq('products.product_type', 'ad_package')

      if (!data || data.length === 0) return false

      const now = new Date()
      for (const item of data) {
        const order = (item as any).orders
        const product = (item as any).products
        const startDate = item.activation_date
          ? new Date(item.activation_date)
          : new Date(order.created_at)
        if (startDate > now) continue
        const durationMs = (product.duration_days * 86400000) + (product.duration_hours * 3600000)
        const expiryDate = new Date(startDate.getTime() + durationMs)
        if (expiryDate > now) {
          setHasActiveAd(true)
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  const loadExcludedModels = async (clubId: string) => {
    try {
      const supabase = createClient()
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

      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, public_id, is_verified, profile_status')
        .eq('role', 'model')
        .order('username', { ascending: true })

      if (fetchError) {
        setError('Failed to load models.')
        return
      }

      if (!profiles || profiles.length === 0) {
        setAllModels([])
        return
      }

      const availableProfiles = profiles.filter(p => !excludedModelIds.includes(p.id))

      if (availableProfiles.length === 0) {
        setAllModels([])
        return
      }

      const modelIds = availableProfiles.map(p => p.id)
      const { data: modelDetails } = await supabase
        .from('model_details')
        .select('model_id, showname, city, age')
        .in('model_id', modelIds)

      const detailsMap = new Map(modelDetails?.map(d => [d.model_id, d]) || [])

      setAllModels(availableProfiles.map(profile => ({
        ...profile,
        showname: detailsMap.get(profile.id)?.showname,
        city: detailsMap.get(profile.id)?.city,
        age: detailsMap.get(profile.id)?.age
      })))
    } catch (err: any) {
      setError('Failed to load models: ' + err.message)
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredModels([])
      setError('')
      return
    }

    const searchLower = query.toLowerCase()
    const filtered = allModels.filter(model =>
      model.username.toLowerCase().includes(searchLower) ||
      (model.showname && model.showname.toLowerCase().includes(searchLower))
    )

    setFilteredModels(filtered)
    setError(filtered.length === 0 ? `No models found matching "${query}"` : '')
  }

  const isMatchingSearch = (model: ModelSearchResult) => {
    if (!searchQuery.trim()) return false
    return filteredModels.some(m => m.id === model.id)
  }

  const getSortedModels = () => {
    if (!searchQuery.trim() || filteredModels.length === 0) return allModels
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

      const { data: existingInvite } = await supabase
        .from('club_invites')
        .select('id, status')
        .eq('club_id', user.id)
        .eq('invited_model_id', selectedModel.id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle()

      if (existingInvite) {
        setError(existingInvite.status === 'pending'
          ? 'You already have a pending invite for this model'
          : 'This model is already part of your club')
        setSending(false)
        return
      }

      // Check club member limit (max 10 accepted members)
      const { data: currentMembers } = await supabase
        .from('club_invites')
        .select('id')
        .eq('club_id', user.id)
        .eq('status', 'accepted')

      if ((currentMembers?.length || 0) >= 10) {
        setError('Your club has reached the maximum of 10 models. Remove one first to invite a new one.')
        setSending(false)
        return
      }

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

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Invite Model</h1>
            <p className="text-xs text-gray-500">Search for a model and send them an invitation to join your club</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/company/models')}
            className="ml-auto flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back
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

        {!hasActiveAd && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">Active ad required</p>
                <p className="text-xs text-amber-700 mt-1">
                  You need an active ad package to send invitations to models. Activate an ad first so models can find and view your club profile.
                </p>
                <Link
                  href="/dashboard/company/activate-ad"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Activate Ad
                </Link>
              </div>
            </div>
          </div>
        )}

        {hasActiveAd && <>
        {/* Search */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              placeholder="Search by username or showname..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {searchQuery.trim() && filteredModels.length > 0
              ? `${filteredModels.length} of ${allModels.length} matching`
              : `${allModels.length} model${allModels.length !== 1 ? 's' : ''} available`}
          </p>
        </div>

        {/* Models list */}
        {!selectedModel && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-bold text-gray-800 mb-3">
              All Models ({allModels.length})
              {searchQuery.trim() && filteredModels.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-brand">
                  · {filteredModels.length} match{filteredModels.length !== 1 ? 'es' : ''}
                </span>
              )}
            </p>
            {allModels.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                <p className="text-sm text-gray-500">No models available</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {getSortedModels().map((model) => {
                  const isMatching = isMatchingSearch(model)
                  return (
                    <div
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer transition-colors ${
                        isMatching
                          ? 'border-brand/40 bg-brand/5 hover:border-brand/60'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                          {model.username?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {model.showname || model.username}
                              {model.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{model.public_id}</span>}
                            </p>
                            {model.is_verified && (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            @{model.username}
                            {(model.age || model.city) && (
                              <span className="ml-1">
                                · {[model.age ? `${model.age}y` : '', model.city].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-brand bg-brand/10 px-2.5 py-1 rounded-lg shrink-0 ml-2">
                        Select
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Send invite panel */}
        {selectedModel && (
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <p className="text-sm font-bold text-gray-800">Send Invitation</p>

            {/* Selected model preview */}
            <div className="flex items-center gap-3 p-3 bg-brand/5 border border-brand/20 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-sm shrink-0">
                {selectedModel.username?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedModel.showname || selectedModel.username}
                  {selectedModel.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{selectedModel.public_id}</span>}
                </p>
                <p className="text-xs text-gray-500">@{selectedModel.username}</p>
              </div>
              <button
                onClick={() => { setSelectedModel(null); setInviteMessage('') }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1">
                Personal Message <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                rows={3}
                placeholder="Add a personal message to your invitation..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{inviteMessage.length} / 500</p>
            </div>

            {/* Info */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1">What happens next?</p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>· The model will receive a notification</li>
                <li>· They can accept or decline your invitation</li>
                <li>· If accepted, they'll appear in your models list</li>
                <li>· Models can be part of multiple clubs</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                onClick={() => { setSelectedModel(null); setInviteMessage('') }}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={sending}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        )}
        </>}

      </div>
    </div>
  )
}
