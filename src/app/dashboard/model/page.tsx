'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import {
  Building2, CheckCircle, XCircle, BarChart2, Eye, MousePointerClick,
  Heart, Share2, Camera, Lightbulb, Mail, LifeBuoy, ChevronRight, Handshake,
  MessageCircle, Lock, Send, Loader2, Trash2
} from 'lucide-react'

export default function ModelDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [modelDetails, setModelDetails] = useState<any>(null)
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [pendingCollabs, setPendingCollabs] = useState<any[]>([])
  const [clubInfo, setClubInfo] = useState<any>(null)
  const [modelStats, setModelStats] = useState<{ total_profile_views: number; total_contact_views: number; total_favorites: number; total_shares: number } | null>(null)
  const [photoCount, setPhotoCount] = useState<number | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [hasActiveAd, setHasActiveAd] = useState(false)
  const [activeStatus, setActiveStatus] = useState<any>(null)
  const [statusText, setStatusText] = useState('')
  const [statusPosting, setStatusPosting] = useState(false)
  const [statusDeleting, setStatusDeleting] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', user.id).single()

        if (!profileData?.onboarding_completed) { router.push('/onboarding'); return }

        const { data: modelDetailsData } = await supabase
          .from('model_details').select('*').eq('model_id', user.id).single()

        const { data: invitesData } = await supabase
          .from('club_invites')
          .select('id, club_id, message, invited_at')
          .eq('invited_model_id', user.id)
          .eq('status', 'pending')
          .order('invited_at', { ascending: false })
          .limit(3)

        let enrichedInvites: any[] = []
        if (invitesData?.length) {
          const { data: inviteClubsData } = await supabase
            .from('club_details')
            .select('club_id, club_name, display_name')
            .in('club_id', invitesData.map(i => i.club_id))
          const clubsMap = new Map(inviteClubsData?.map(c => [c.club_id, c]) || [])
          enrichedInvites = invitesData.map(inv => ({ ...inv, club_details: clubsMap.get(inv.club_id) }))
        }

        const { data: collabInvitesData } = await supabase
          .from('model_collaborations')
          .select('id, sender_id, message, created_at')
          .eq('receiver_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(3)

        let enrichedCollabs: any[] = []
        if (collabInvitesData?.length) {
          const senderIds = collabInvitesData.map(c => c.sender_id)
          const [{ data: senderProfiles }, { data: senderDetails }] = await Promise.all([
            supabase.from('profiles').select('id, username').in('id', senderIds),
            supabase.from('model_details').select('model_id, showname').in('model_id', senderIds),
          ])
          const profMap = new Map(senderProfiles?.map(p => [p.id, p]) || [])
          const detMap = new Map(senderDetails?.map(d => [d.model_id, d]) || [])
          enrichedCollabs = collabInvitesData.map(c => ({
            ...c,
            sender_name: detMap.get(c.sender_id)?.showname || profMap.get(c.sender_id)?.username || 'A model',
          }))
        }

        const { data: acceptedInvites } = await supabase
          .from('club_invites').select('club_id')
          .eq('invited_model_id', user.id).eq('status', 'accepted')

        const { data: statsData } = await supabase
          .from('model_statistics_summary')
          .select('total_profile_views, total_contact_views, total_favorites, total_shares')
          .eq('model_id', user.id)
          .single()

        const { count: photosCount } = await supabase
          .from('model_photos')
          .select('id', { count: 'exact', head: true })
          .eq('model_id', user.id)

        const { data: verificationData } = await supabase
          .from('verifications')
          .select('status')
          .eq('user_id', user.id)
          .single()

        const { data: orderItemsData } = await supabase
          .from('order_items')
          .select(`id, activation_date, orders!inner(user_id, status, created_at), products!inner(product_type, duration_days, duration_hours)`)
          .eq('orders.user_id', user.id)
          .eq('orders.status', 'paid')
          .eq('products.product_type', 'ad_package')

        let adActive = false
        if (orderItemsData?.length) {
          const nowDate = new Date()
          for (const item of orderItemsData) {
            const order = (item as any).orders
            const product = (item as any).products
            const startDate = item.activation_date ? new Date(item.activation_date) : new Date(order.created_at)
            if (startDate > nowDate) continue
            const durationMs = (product.duration_days * 86400000) + (product.duration_hours * 3600000)
            if (new Date(startDate.getTime() + durationMs) > nowDate) { adActive = true; break }
          }
        }

        const { data: statusMsgs } = await supabase
          .from('model_status_messages')
          .select('id, message, created_at, expires_at')
          .eq('model_id', user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)

        setUser(user)
        setProfile(profileData)
        setModelDetails(modelDetailsData)
        setClubInfo({ count: acceptedInvites?.length || 0 })
        setPendingInvites(enrichedInvites)
        setPendingCollabs(enrichedCollabs)
        setModelStats(statsData || null)
        setPhotoCount(photosCount ?? 0)
        setIsVerified(verificationData?.status === 'approved')
        setHasActiveAd(adActive)
        setActiveStatus(statusMsgs?.[0] || null)
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }
    checkUser()
  }, [router])

  async function postStatusMessage() {
    if (!statusText.trim() || !user) return
    setStatusPosting(true)
    try {
      const supabase = createClient()
      if (activeStatus) {
        await supabase.from('model_status_messages').delete().eq('id', activeStatus.id)
      }
      const { data, error } = await supabase
        .from('model_status_messages')
        .insert({ model_id: user.id, message: statusText.trim() })
        .select()
        .single()
      if (!error && data) {
        setActiveStatus(data)
        setStatusText('')
      }
    } catch {}
    finally { setStatusPosting(false) }
  }

  async function deleteStatusMessage() {
    if (!activeStatus) return
    setStatusDeleting(true)
    try {
      const supabase = createClient()
      await supabase.from('model_status_messages').delete().eq('id', activeStatus.id)
      setActiveStatus(null)
    } catch {}
    finally { setStatusDeleting(false) }
  }

  if (loading) {
    return (
      <>
        <DashboardSidebar userRole="model" />
        <div className="min-h-screen flex items-center justify-center bg-gray-50 ml-[280px]">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    )
  }

  const clientCode = user?.id?.slice(0, 8).toUpperCase() || 'N/A'
  const showname = modelDetails?.showname || profile?.username || 'there'

  return (
    <>
      <DashboardSidebar userRole="model" />
      <div className="min-h-screen bg-gray-50 py-8 px-6 ml-[280px]">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ── Blocked account ── */}
          {profile?.is_blocked && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-800 mb-1">Account suspended</p>
                  <p className="text-sm text-red-700">
                    Your account has been suspended by our administration team.
                    {profile?.blocked_reason && <span className="block mt-1 font-medium">{profile.blocked_reason}</span>}
                  </p>
                  {profile?.blocked_at && (
                    <p className="text-xs text-red-500 mt-1">
                      {new Date(profile.blocked_at).toLocaleDateString()} at {new Date(profile.blocked_at).toLocaleTimeString()}
                    </p>
                  )}
                  <div className="mt-3 text-xs text-red-700 space-y-0.5">
                    <p>· Your profile is hidden from search results</p>
                    <p>· You cannot receive new messages</p>
                    <p>· Advertising features are disabled</p>
                  </div>
                  <a
                    href="mailto:support@nicemodels.ch?subject=Account Blocked - Appeal Request"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-700 hover:text-red-900 underline underline-offset-2"
                  >
                    <Mail className="w-3.5 h-3.5" /> Contact support to appeal
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ── Club invites ── */}
          {pendingInvites.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-indigo-100 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {pendingInvites.length} pending club invitation{pendingInvites.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pendingInvites.length === 1
                      ? `${pendingInvites[0].club_details?.display_name || pendingInvites[0].club_details?.club_name || 'A club'} wants you to join their roster.`
                      : 'Multiple clubs want you to join their roster.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/model/invites')}
                className="shrink-0 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                Review <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Collaboration requests ── */}
          {pendingCollabs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-pink-100 flex items-center justify-center shrink-0">
                  <Handshake className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {pendingCollabs.length} collaboration request{pendingCollabs.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pendingCollabs.length === 1
                      ? `${pendingCollabs[0].sender_name} wants to collaborate with you.`
                      : 'Other models want to collaborate with you.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/model/collaborations')}
                className="shrink-0 text-xs font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1 transition-colors"
              >
                Review <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Status message ── */}
          <div className={`border rounded-lg overflow-hidden ${hasActiveAd ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-200'}`}>
            <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${hasActiveAd ? 'bg-violet-100' : 'bg-gray-200'}`}>
                <MessageCircle className={`w-4 h-4 ${hasActiveAd ? 'text-violet-600' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Status Message</p>
                <p className="text-xs text-gray-500">Post a status visible on the homepage sidebar</p>
              </div>
              {hasActiveAd && activeStatus && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                </span>
              )}
            </div>
            <div className="px-5 py-4">
              {hasActiveAd ? (
                activeStatus ? (
                  <div className="space-y-3">
                    <div className="bg-violet-50 border border-violet-100 rounded-lg px-4 py-3">
                      <p className="text-sm text-gray-800">{activeStatus.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1.5">
                        Posted {new Date(activeStatus.created_at).toLocaleDateString()} · Expires {new Date(activeStatus.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Delete your current status to post a new one</p>
                      <button
                        onClick={deleteStatusMessage}
                        disabled={statusDeleting}
                        className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors"
                      >
                        {statusDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <textarea
                        value={statusText}
                        onChange={e => setStatusText(e.target.value)}
                        placeholder="Write a status message…"
                        maxLength={200}
                        rows={2}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                      />
                      <button
                        onClick={postStatusMessage}
                        disabled={statusPosting || !statusText.trim()}
                        className="self-end px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
                      >
                        {statusPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Post
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">{statusText.length}/200 · Visible for 7 days</p>
                  </div>
                )
              ) : (
                <div className="text-center py-4">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Ad required</p>
                  <p className="text-xs text-gray-400 mb-3 max-w-xs mx-auto">
                    You need an active ad package to post status messages. Activate your ad to start sharing updates.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/model/activate-ad')}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 mx-auto transition-colors"
                  >
                    Activate Ad <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Welcome header ── */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  Welcome back, <span className="text-brand">{showname}</span>
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {clientCode}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── Left / main ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Photo alert */}
              {photoCount !== null && photoCount < 3 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-rose-100 flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Your profile needs photos</p>
                      <p className="text-xs text-gray-500">Upload at least 3 photos to activate your profile ({photoCount}/3 uploaded)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/dashboard/model/profile/pictures-video')}
                    className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
                  >
                    Upload <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Beta notice */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full">Beta</span>
                  <p className="text-sm font-bold text-gray-900">Welcome to the early access</p>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  You're one of the first models on <span className="font-semibold text-gray-900">nicemodels.ch</span>. Everything is free while we test and improve the platform.
                </p>
                <div className="space-y-1.5 mb-4">
                  {[
                    'No prices, no payments during beta',
                    'Help us test, give feedback and shape the portal',
                    'We will inform you clearly before any pricing starts',
                  ].map(tip => (
                    <div key={tip} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Complete your profile to get the best visibility when we go live.</p>
                  <button
                    onClick={() => router.push('/dashboard/model/profile/pictures-video')}
                    className="shrink-0 text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 ml-4"
                  >
                    Complete profile <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">How to get started</p>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      step: '1',
                      title: 'Complete your profile',
                      desc: 'Go to My Profile and fill in your biography, details and services. Make sure everything is accurate — this is exactly what clients will see.',
                      action: 'Open My Profile',
                      href: '/dashboard/model/profile/biography',
                    },
                    {
                      step: '2',
                      title: 'Upload your photos',
                      desc: 'Add at least 3 high-quality photos so clients can see you. The better the photos, the more interest you will get.',
                      action: 'Upload photos',
                      href: '/dashboard/model/profile/pictures-video',
                    },
                    {
                      step: '3',
                      title: 'Activate your ad',
                      desc: 'Go to Activate Ad and choose a duration. During beta, this is 100% free — your profile will appear in search results.',
                      action: 'Activate Ad',
                      href: '/dashboard/model/activate-ad',
                    },
                  ].map(({ step, title, desc, action, href }) => (
                    <div key={step} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {step}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
                        <p className="text-xs text-gray-500 mb-1.5">{desc}</p>
                        <button
                          onClick={() => router.push(href)}
                          className="text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 transition-colors"
                        >
                          {action} <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile tips */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Profile tips</p>
                </div>
                <div className="space-y-2.5">
                  {[
                    'A complete profile gets 3× more views than an incomplete one',
                    'Add a verification badge to build client trust',
                    'Update your photos weekly for best ranking results',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-brand font-bold shrink-0 mt-0.5">→</span>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Right sidebar ── */}
            <div className="space-y-4">

              {/* Club membership */}
              {clubInfo && clubInfo.count > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Your clubs</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{clubInfo.count}</span>
                    <button
                      onClick={() => router.push('/dashboard/model/invites')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Club{clubInfo.count !== 1 ? 's' : ''} you're part of</p>
                </div>
              )}

              {/* Stats */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Stats</p>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Eye, label: 'Profile views', value: modelStats?.total_profile_views ?? 0, color: 'text-blue-500' },
                    { icon: MousePointerClick, label: 'Contact views', value: modelStats?.total_contact_views ?? 0, color: 'text-purple-500' },
                    { icon: Heart, label: 'Favorites', value: modelStats?.total_favorites ?? 0, color: 'text-brand' },
                    { icon: Share2, label: 'Shares', value: modelStats?.total_shares ?? 0, color: 'text-indigo-500' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-sm text-gray-600">{label}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile strength */}
              {(() => {
                const hasPhotos = (photoCount ?? 0) >= 3
                const strength = isVerified ? 100 : hasPhotos ? 75 : 35
                return (
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-800">Profile strength</p>
                      <span className="text-sm font-bold text-brand">{strength}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                      <div className="bg-brand h-1.5 rounded-full transition-all duration-500" style={{ width: `${strength}%` }} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <CheckCircle className="w-4 h-4 shrink-0" /> Basic info added
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${hasPhotos ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {hasPhotos
                          ? <CheckCircle className="w-4 h-4 shrink-0" />
                          : <XCircle className="w-4 h-4 shrink-0" />
                        } Add more photos
                      </div>
                      <div className={`flex items-center gap-2 text-sm ${isVerified ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {isVerified
                          ? <CheckCircle className="w-4 h-4 shrink-0" />
                          : <XCircle className="w-4 h-4 shrink-0" />
                        } Verify your account
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Support */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
                    <LifeBuoy className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Support</p>
                </div>
                <div className="space-y-2">
                  <a href="mailto:support@nicemodels.ch" className="flex items-center gap-2 text-sm text-gray-600 hover:text-brand transition-colors">
                    <Mail className="w-4 h-4 text-gray-400" /> support@nicemodels.ch
                  </a>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" /> Live chat available 24/7
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
