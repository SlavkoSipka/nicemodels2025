'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { htmlToPlainText } from '@/lib/plainText'
import {
  listingTelHref,
  listingSmsHref,
  listingWhatsAppHref,
  listingViberHref,
  listingTelegramHref,
} from '@/lib/listingContactLinks'
import { trackModelAction, trackProfileView } from '@/lib/tracking'
import { usePageLoader } from '@/components/layout/PageLoader'
import StartChatButton from '@/components/chat/StartChatButton'
import {
  MapPin,
  Heart,
  Share2,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Clock,
  Calendar,
  DollarSign,
  User,
  Ruler,
  Eye,
  Palette,
  Scale,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Languages as LanguagesIcon,
  Sparkles,
  ImageIcon,
  Home,
  Briefcase,
  Info,
  Star,
  Users,
  Handshake
} from 'lucide-react'

interface ModelProfileClientProps {
  modelData: any
  allModelIds: string[]
  prevId: string | null
  nextId: string | null
}

const SHUFFLE_KEY = 'nm_browse_order'
const SHUFFLE_IDX  = 'nm_browse_index'

function getShuffled(ids: string[]): string[] {
  const arr = [...ids]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function ModelProfileClient({ modelData, allModelIds, prevId: serverPrevId, nextId: serverNextId }: ModelProfileClientProps) {
  const {
    profile,
    modelDetails,
    photos,
    videos,
    rates,
    services,
    languages,
    workingHours,
    contactDetails,
    comments,
    collabModels = [],
    likeCounts: initialLikeCounts = {},
    userLikedPhotoIds: initialUserLiked = [],
    hasActiveAd = true,
    viewCount = 0,
  } = modelData

  const t = useTranslations('models.profile')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showContact, setShowContact] = useState(false)
  const [idCopied, setIdCopied] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const publicIdLabel = profile.public_id ? `#${profile.public_id}` : `#${profile.id.slice(0, 6)}`
  const handleCopyId = () => {
    navigator.clipboard.writeText(publicIdLabel)
    setIdCopied(true)
    setTimeout(() => setIdCopied(false), 1800)
  }
  const [isFavorite, setIsFavorite] = useState(false)
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(true)
  const [isSavingFavorite, setIsSavingFavorite] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCommentLoginModal, setShowCommentLoginModal] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentRating, setCommentRating] = useState(0)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentSuccess, setCommentSuccess] = useState(false)
  const [hasExistingComment, setHasExistingComment] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [myComment, setMyComment] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [photoLikeCounts, setPhotoLikeCounts] = useState<Record<string, number>>(initialLikeCounts)
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set(initialUserLiked))
  const [likingPhoto, setLikingPhoto] = useState<string | null>(null)
  const [heartPop, setHeartPop] = useState(false)

  // Quick-invite state (only for logged-in models / clubs)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [collabStatus, setCollabStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'loading'>('loading')
  const [clubInviteStatus, setClubInviteStatus] = useState<'none' | 'pending' | 'accepted' | 'loading'>('loading')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [inviteError, setInviteError] = useState('')

  const router = useRouter()
  const { show: showLoader } = usePageLoader()

  // ── Shuffle-based prev/next navigation ──────────────────────────────────
  const [browseNav, setBrowseNav] = useState<{ prevId: string | null; nextId: string | null }>({
    prevId: serverPrevId,
    nextId: serverNextId,
  })

  useEffect(() => {
    if (allModelIds.length < 2) return
    const currentId = profile.id

    let order: string[] = []
    let idx = -1

    try {
      const stored = localStorage.getItem(SHUFFLE_KEY)
      order = stored ? JSON.parse(stored) : []
    } catch { order = [] }

    // If stored order doesn't contain all current IDs, rebuild it
    const activeSet = new Set(allModelIds)
    const valid = order.length === allModelIds.length &&
      order.every(id => activeSet.has(id))

    if (!valid) {
      order = getShuffled(allModelIds)
      localStorage.setItem(SHUFFLE_KEY, JSON.stringify(order))
    }

    idx = order.indexOf(currentId)
    if (idx === -1) {
      // Current model not in order somehow — reset
      order = getShuffled(allModelIds)
      localStorage.setItem(SHUFFLE_KEY, JSON.stringify(order))
      idx = order.indexOf(currentId)
    }

    localStorage.setItem(SHUFFLE_IDX, String(idx))

    const total = order.length
    const pId = order[(idx - 1 + total) % total]
    const nId = order[(idx + 1) % total]
    setBrowseNav({ prevId: pId, nextId: nId })
  }, [profile.id, allModelIds, serverPrevId, serverNextId])

  const goToPrev = () => { if (browseNav.prevId) { showLoader(); router.push(`/models/${browseNav.prevId}`) } }
  const goToNext = () => { if (browseNav.nextId) { showLoader(); router.push(`/models/${browseNav.nextId}`) } }

  // Prefetch prev/next routes as soon as we know their IDs
  useEffect(() => {
    if (browseNav.prevId) router.prefetch(`/models/${browseNav.prevId}`)
    if (browseNav.nextId) router.prefetch(`/models/${browseNav.nextId}`)
  }, [browseNav.prevId, browseNav.nextId, router])
  // ────────────────────────────────────────────────────────────────────────

  // Check if model is already favorited and if user has existing comment
  useEffect(() => {
    checkIfFavorite()
    checkExistingComment()
    checkIfLoggedIn()
    trackProfileView(profile.id)
  }, [profile.id])

  const checkIfLoggedIn = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setIsLoggedIn(!!user)
    setCurrentUserId(user?.id || null)

    if (user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = userProfile?.role || null
      setCurrentUserRole(role)

      if (user.id !== profile.id) {
        if (role === 'model') {
          setClubInviteStatus('none')
          checkCollabStatus(user.id)
        } else if (role === 'company') {
          setCollabStatus('none')
          checkClubInviteStatus(user.id)
        } else {
          setCollabStatus('none')
          setClubInviteStatus('none')
        }
      } else {
        setCollabStatus('none')
        setClubInviteStatus('none')
      }
    } else {
      setCollabStatus('none')
      setClubInviteStatus('none')
    }
  }

  const checkCollabStatus = async (userId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('model_collaborations')
      .select('id, status, sender_id')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${userId})`)
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (!data) setCollabStatus('none')
    else if (data.status === 'accepted') setCollabStatus('accepted')
    else if (data.sender_id === userId) setCollabStatus('pending_sent')
    else setCollabStatus('pending_received')
  }

  const checkClubInviteStatus = async (clubId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('club_invites')
      .select('id, status')
      .eq('club_id', clubId)
      .eq('invited_model_id', profile.id)
      .in('status', ['pending', 'accepted'])
      .maybeSingle()

    if (!data) setClubInviteStatus('none')
    else if (data.status === 'accepted') setClubInviteStatus('accepted')
    else setClubInviteStatus('pending')
  }

  const countAcceptedCollabs = async (supabase: any, userId: string): Promise<number> => {
    const [{ data: asSender }, { data: asReceiver }] = await Promise.all([
      supabase.from('model_collaborations').select('id').eq('sender_id', userId).eq('status', 'accepted'),
      supabase.from('model_collaborations').select('id').eq('receiver_id', userId).eq('status', 'accepted'),
    ])
    return (asSender?.length || 0) + (asReceiver?.length || 0)
  }

  const sendCollabRequest = async () => {
    if (!currentUserId) return
    setSendingInvite(true)
    setInviteError('')
    try {
      const supabase = createClient()

      // Check limits for both sides
      const [senderCount, receiverCount] = await Promise.all([
        countAcceptedCollabs(supabase, currentUserId),
        countAcceptedCollabs(supabase, profile.id),
      ])

      if (senderCount >= 2) {
        setInviteError('You already have 2 collaborations. Remove one first to add a new one.')
        setTimeout(() => setInviteError(''), 5000)
        setSendingInvite(false)
        return
      }
      if (receiverCount >= 2) {
        setInviteError('This model already has 2 collaborations and cannot accept more at this time.')
        setTimeout(() => setInviteError(''), 5000)
        setSendingInvite(false)
        return
      }

      const { error } = await supabase
        .from('model_collaborations')
        .insert({ sender_id: currentUserId, receiver_id: profile.id, status: 'pending' })
      if (error) throw error
      setCollabStatus('pending_sent')
      setInviteSuccess('Collaboration request sent!')
      setTimeout(() => setInviteSuccess(''), 4000)
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send request.')
      setTimeout(() => setInviteError(''), 4000)
    } finally { setSendingInvite(false) }
  }

  const sendClubInvite = async () => {
    if (!currentUserId) return
    setSendingInvite(true)
    setInviteError('')
    try {
      const supabase = createClient()

      // Check club member limit (max 10 accepted members)
      const { data: currentMembers } = await supabase
        .from('club_invites')
        .select('id')
        .eq('club_id', currentUserId)
        .eq('status', 'accepted')

      if ((currentMembers?.length || 0) >= 10) {
        setInviteError('Your club has reached the maximum of 10 models. Remove one first to invite a new one.')
        setTimeout(() => setInviteError(''), 5000)
        setSendingInvite(false)
        return
      }

      const { error } = await supabase
        .from('club_invites')
        .insert({ club_id: currentUserId, invited_model_id: profile.id, status: 'pending' })
      if (error) throw error
      setClubInviteStatus('pending')
      setInviteSuccess('Club invitation sent!')
      setTimeout(() => setInviteSuccess(''), 4000)
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation.')
      setTimeout(() => setInviteError(''), 4000)
    } finally { setSendingInvite(false) }
  }

  const checkIfFavorite = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setIsCheckingFavorite(false)
      return
    }

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('model_id', profile.id)
      .single()

    setIsFavorite(!!data)
    setIsCheckingFavorite(false)
  }

  const checkExistingComment = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('model_comments')
      .select('id, comment_text, rating, status, created_at')
      .eq('user_id', user.id)
      .eq('model_id', profile.id)
      .maybeSingle()

    if (data && !error) {
      setMyComment(data)
      // Only block form if comment is online or awaiting review (not rejected)
      setHasExistingComment(
        data.status === 'pending' ||
        data.status === 'approved' ||
        data.status === 'reviewed'
      )
    } else {
      setMyComment(null)
      setHasExistingComment(false)
    }
  }

  const submitComment = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setShowLoginModal(true)
      return
    }

    if (!commentText.trim()) {
      return
    }

    setSubmittingComment(true)

    // Blocked users cannot post new comments. Also reject if target model is blocked.
    const { data: blockCheck } = await supabase
      .from('profiles')
      .select('id, is_blocked')
      .in('id', [user.id, profile.id])

    const blockedRow = (blockCheck || []).find((r: any) => r.is_blocked)
    if (blockedRow) {
      setSubmittingComment(false)
      alert(blockedRow.id === user.id
        ? 'Your account is suspended. You cannot post comments.'
        : 'This profile is currently unavailable.')
      return
    }

    const { error } = await supabase
      .from('model_comments')
      .insert({
        user_id: user.id,
        model_id: profile.id,
        comment_text: commentText.trim(),
        rating: commentRating || null,
        status: 'approved'
      })

    if (!error) {
      setCommentSuccess(true)
      setCommentText('')
      setCommentRating(0)
      setShowCommentForm(false)
      setHasExistingComment(true)
      
      await checkExistingComment()
      
      setTimeout(() => setCommentSuccess(false), 5000)
    }

    setSubmittingComment(false)
  }

  const toggleFavorite = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Show login modal for guests
      setShowLoginModal(true)
      return
    }

    setIsSavingFavorite(true)

    if (isFavorite) {
      // Remove from favorites
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('model_id', profile.id)

      if (!error) {
        setIsFavorite(false)
      }
    } else {
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          model_id: profile.id
        })

      if (!error) {
        setIsFavorite(true)
        // Track favorite action
        trackModelAction(profile.id, 'favorite_add')
      }
    }

    setIsSavingFavorite(false)
  }

  const handleShowContact = () => {
    // Track contact view action
    trackModelAction(profile.id, 'contact_view')
    setShowContact(true)
  }

  const handleShare = async () => {
    // Track share action
    trackModelAction(profile.id, 'share')
    
    const shareUrl = window.location.href
    const shareTitle = `${modelDetails?.showname || profile.username} - Nice Models`
    const shareText = `Check out ${modelDetails?.showname || profile.username} on Nice Models!`

    // Check if Web Share API is available (mainly mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        })
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err)
      }
    } else {
      // Fallback for desktop - copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        setShowShareToast(true)
        setTimeout(() => setShowShareToast(false), 3000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const togglePhotoLike = async (photoId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setShowLoginModal(true)
      return
    }

    if (likingPhoto) return
    setLikingPhoto(photoId)

    const alreadyLiked = likedPhotos.has(photoId)

    if (alreadyLiked) {
      const { error } = await supabase
        .from('photo_likes')
        .delete()
        .eq('photo_id', photoId)
        .eq('user_id', user.id)

      if (!error) {
        setLikedPhotos(prev => { const s = new Set(prev); s.delete(photoId); return s })
        setPhotoLikeCounts(prev => ({ ...prev, [photoId]: Math.max((prev[photoId] || 1) - 1, 0) }))
      }
    } else {
      const { error } = await supabase
        .from('photo_likes')
        .insert({ photo_id: photoId, user_id: user.id })

      if (!error) {
        setLikedPhotos(prev => new Set(prev).add(photoId))
        setPhotoLikeCounts(prev => ({ ...prev, [photoId]: (prev[photoId] || 0) + 1 }))
        setHeartPop(true)
        setTimeout(() => setHeartPop(false), 600)
      }
    }

    setLikingPhoto(null)
  }

  // Build unified media list: photos first, then videos
  const mediaItems: { type: 'photo' | 'video'; url: string; id?: string }[] = [
    ...photos
      .map((photo: any) => {
        if (!photo.file_path) return null
        return {
          type: 'photo' as const,
          id: photo.id,
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${photo.file_path}`
        }
      })
      .filter(Boolean),
    ...videos
      .map((video: any) => {
        if (!video.file_path) return null
        return {
          type: 'video' as const,
          url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-videos/${video.file_path}`
        }
      })
      .filter(Boolean),
  ]

  // Keep photoUrls for backward compat (stats display)
  const photoUrls = mediaItems.filter(m => m.type === 'photo').map(m => m.url)

  // Preload photos adjacent to the current one so flipping feels instant
  useEffect(() => {
    const toPreload = [
      mediaItems[selectedPhotoIndex + 1],
      mediaItems[selectedPhotoIndex - 1],
    ].filter(Boolean)
    toPreload.forEach(item => {
      if (item?.type === 'photo') {
        const img = new window.Image()
        img.src = item.url
      }
    })
  }, [selectedPhotoIndex, mediaItems])

  // Keyboard navigation for lightbox — after mediaItems declaration
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % mediaItems.length)
      if (e.key === 'ArrowLeft')  setLightboxIndex(i => (i - 1 + mediaItems.length) % mediaItems.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, mediaItems.length])

  const formatLanguageLevel = (level: string) => {
    const levels: Record<string, string> = {
      'basic': 'Basic',
      'fair': 'Fair',
      'good': 'Good',
      'excellent_native': 'Excellent/Native'
    }
    return levels[level] || level
  }

  /** Matches dashboard `languages/page.tsx` levelToDefaultStars */
  const levelToStarCount = (level: string) => {
    if (level === 'basic') return 2
    if (level === 'fair') return 3
    if (level === 'good') return 4
    if (level === 'excellent_native') return 5
    return 3
  }

  /** Tooltip for hover over star position 1–5 (what that rating means) */
  const languageStarTooltip = (starIndex: number) => {
    const t: Record<number, string> = {
      1: '1 star — Elementary: familiar words and very short phrases.',
      2: '2 stars — Basic: simple conversations in everyday situations.',
      3: '3 stars — Fair: comfortable in most common social and travel contexts.',
      4: '4 stars — Good: strong fluency; complex topics with only small gaps.',
      5: '5 stars — Excellent / native-like: full fluency in professional and social settings.',
    }
    return t[starIndex] ?? ''
  }

  const formatDayOfWeek = (day: string) => {
    const days: Record<string, string> = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    }
    return days[day] || day
  }

  const formatDuration = (duration: string) => {
    const durations: Record<string, string> = {
      '30_minutes': '30 minutes',
      '1_hour': '1 hour',
      '2_hours': '2 hours',
      'additional_hour': 'Additional hour',
      'overnight': 'Overnight',
      'dinner_date': 'Dinner date',
      'weekend': 'Weekend',
      'specific_time': 'Specific time'
    }
    return durations[duration] || duration
  }

  const formatEthnicity = (ethnicity: string) => {
    return ethnicity?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'
  }

  const formatHairColor = (color: string) => {
    return color?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'
  }

  const formatEyeColor = (color: string) => {
    return color?.replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'
  }

  const formatGender = (gender: string) => {
    return gender?.charAt(0).toUpperCase() + gender?.slice(1) || 'Not specified'
  }

  const formatIncallOptions = (options: string[]) => {
    if (!options || options.length === 0) return []
    return options.map(opt => opt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
  }

  return (
    <div className="min-h-screen" style={{ background: '#fce9f3' }}>

      {!hasActiveAd && (
        <div
          className="w-full px-4 py-3 text-center text-sm font-semibold border-b"
          style={{
            background: 'linear-gradient(90deg, rgba(254,243,199,0.95), rgba(254,215,170,0.95))',
            borderColor: '#f59e0b',
            color: '#78350f',
          }}
          role="status"
        >
          {t('noActiveAdBanner')}
        </div>
      )}

      {/* ── Floating prev/next nav ── */}
      {allModelIds.length > 1 && (
        <>
          {/* PREV (desktop – tall with label) */}
          <button
            onClick={goToPrev}
            aria-label={t('previousModel')}
            className="hidden lg:flex fixed left-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center justify-center gap-1.5 transition-all duration-200 group"
            style={{
              width: 48, height: 96,
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(157,23,77,0.95)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(236,72,153,0.4)'; (e.currentTarget as HTMLButtonElement).style.color = 'white' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.92)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color = '' }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: '#64748b' }} />
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.15em' }}>{t('previousSedcard')}</span>
          </button>

          {/* NEXT (desktop – tall with label) */}
          <button
            onClick={goToNext}
            aria-label={t('nextModel')}
            className="hidden lg:flex fixed right-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center justify-center gap-1.5 transition-all duration-200 group"
            style={{
              width: 48, height: 96,
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(157,23,77,0.95)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(236,72,153,0.4)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.92)'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0' }}
          >
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8', writingMode: 'vertical-rl', letterSpacing: '0.15em' }}>{t('nextSedcard')}</span>
            <ChevronRight className="w-5 h-5" style={{ color: '#64748b' }} />
          </button>

          {/* PREV (mobile – compact round, appears on scroll) */}
          <button
            onClick={goToPrev}
            aria-label={t('previousModel')}
            className={`lg:hidden fixed left-2 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 active:scale-95 ${scrolled ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{
              background: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <ChevronLeft className="w-4 h-4" style={{ color: '#64748b' }} />
          </button>

          {/* NEXT (mobile – compact round, appears on scroll) */}
          <button
            onClick={goToNext}
            aria-label={t('nextModel')}
            className={`lg:hidden fixed right-2 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 active:scale-95 ${scrolled ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{
              background: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <ChevronRight className="w-4 h-4" style={{ color: '#64748b' }} />
          </button>
        </>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-4 sm:mb-6 transition-colors hover:text-pink-600 font-medium text-sm"
          style={{ color: '#64748b' }}
        >
          <ChevronLeft className="w-5 h-5" />
          <span>{t('backToSedcards')}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_550px] gap-4 sm:gap-8">
          {/* Left Column - info */}
          <div className="space-y-3 order-2 lg:order-1">

            {/* ── Hero card ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
              {/* Header */}
              <div className="px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-5" style={{ background: '#ffffff' }}>

                {/* Name + ID + verified */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight" style={{ color: '#0f172a' }}>
                      {modelDetails?.showname || profile.username}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    {contactDetails?.show_phone_on_card && contactDetails?.phone_number && (
                      <span className="inline-flex items-center gap-0.5">
                        <a
                          href={listingTelHref(contactDetails.country_code || '', contactDetails.phone_number)}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap px-2 py-1 rounded-md rounded-r-none border border-r-0 hover:opacity-90"
                          style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                          aria-label={t('callPhone', { phone: `${contactDetails.country_code || ''} ${contactDetails.phone_number}`.trim() })}
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {`${contactDetails.country_code || ''} ${contactDetails.phone_number}`.trim()}
                        </a>
                        <a
                          href={listingSmsHref(contactDetails.country_code || '', contactDetails.phone_number)}
                          className="text-[11px] font-bold px-2 py-1 rounded-md rounded-l-none border hover:opacity-90 leading-none self-stretch flex items-center"
                          style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                          title={t('sendSms')}
                          aria-label={t('smsTo', { phone: `${contactDetails.country_code || ''} ${contactDetails.phone_number}`.trim() })}
                        >
                          SMS
                        </a>
                      </span>
                    )}
                    {profile.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' }}>
                        <CheckCircle className="w-3 h-3" /> {t('verified')}
                      </span>
                    )}
                  </div>
                </div>

                {/* City / age line */}
                <div className="flex items-center gap-3 mb-3">
                  {viewCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#64748b' }}>
                      <Eye className="w-4 h-4" />
                      {viewCount.toLocaleString()} {viewCount === 1 ? t('view') : t('views')}
                    </span>
                  )}
                  {modelDetails?.city && (
                    <span className="text-sm font-medium" style={{ color: '#64748b' }}>
                      {modelDetails.city}
                    </span>
                  )}
                  {modelDetails?.age && modelDetails?.city && (
                    <span style={{ color: '#cbd5e1' }}>·</span>
                  )}
                  {modelDetails?.age && (
                    <span className="text-sm font-medium" style={{ color: '#64748b' }}>
                      {t('yearsLabel', { age: modelDetails.age })}
                    </span>
                  )}
                </div>

                {modelDetails?.slogan && (
                  <p className="text-sm italic mb-4 leading-relaxed" style={{ color: '#F472B6' }}>"{modelDetails.slogan}"</p>
                )}

                {/* Show Contact */}
                {!showContact ? (
                  <button
                    onClick={handleShowContact}
                    className="w-full py-3.5 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 mb-3 text-sm tracking-wide"
                    style={{ background: 'linear-gradient(90deg, #9D174D, #EC4899)', boxShadow: '0 4px 20px rgba(236,72,153,0.4)' }}
                  >
                    <Phone className="w-4 h-4" /> {t('showContact')}
                  </button>
                ) : (
                  <div className="mb-3 p-4 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    {contactDetails ? (
                      <div className="space-y-2.5">
                        {contactDetails.phone_number ? (
                          <div className="space-y-2">
                            <a
                              href={listingTelHref(
                                contactDetails.country_code || '',
                                contactDetails.phone_number || ''
                              )}
                              className="text-2xl font-bold transition-colors block hover:underline underline-offset-2 decoration-2"
                              style={{ color: '#EC4899' }}
                            >
                              {contactDetails.country_code || ''} {contactDetails.phone_number}
                            </a>
                            {/* Preference + meta (not app links) */}
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              {contactDetails.contact_instruction && (
                                <span className="text-xs" style={{ color: '#94a3b8' }}>
                                  {contactDetails.contact_instruction === 'sms_and_call' ? t('smsAndCall')
                                    : contactDetails.contact_instruction === 'sms_only' ? t('smsOnly')
                                    : contactDetails.contact_instruction === 'no_sms' ? t('noSms')
                                    : contactDetails.contact_instruction === 'call_only' ? t('callOnly')
                                    : contactDetails.contact_instruction.replace(/_/g, ' ')}
                                </span>
                              )}
                              {contactDetails.no_withheld_numbers && <span className="text-xs" style={{ color: '#94a3b8' }}>{t('noWithheldNumbers')}</span>}
                            </div>
                            {/* Clickable messengers — opens apps / web */}
                            {(contactDetails.has_whatsapp || contactDetails.has_viber || contactDetails.has_telegram) && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {contactDetails.has_whatsapp && (
                                  <a
                                    href={listingWhatsAppHref(
                                      contactDetails.country_code || '',
                                      contactDetails.phone_number || ''
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                    style={{
                                      background: '#ecfdf5',
                                      borderColor: '#86efac',
                                      color: '#047857',
                                    }}
                                  >
                                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
                                    WhatsApp
                                  </a>
                                )}
                                {contactDetails.has_viber && (
                                  <a
                                    href={listingViberHref(
                                      contactDetails.country_code || '',
                                      contactDetails.phone_number || ''
                                    )}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                    style={{
                                      background: '#f5f3ff',
                                      borderColor: '#c4b5fd',
                                      color: '#5b21b6',
                                    }}
                                  >
                                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
                                    Viber
                                  </a>
                                )}
                                {contactDetails.has_telegram && (
                                  <a
                                    href={listingTelegramHref(
                                      contactDetails.country_code || '',
                                      contactDetails.phone_number || ''
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                                    style={{
                                      background: '#eff6ff',
                                      borderColor: '#93c5fd',
                                      color: '#1d4ed8',
                                    }}
                                  >
                                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
                                    Telegram
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        ) : contactDetails.email ? null : (
                          <p className="text-sm text-center py-1" style={{ color: '#94a3b8' }}>{t('noContactDetails')}</p>
                        )}
                        {contactDetails.email && (
                          <a href={`mailto:${contactDetails.email}`} className="flex items-center gap-2 text-sm transition-colors" style={{ color: '#475569' }}>
                            <Mail className="w-4 h-4" style={{ color: '#EC4899' }} /> {contactDetails.email}
                          </a>
                        )}
                        {contactDetails.website && (
                          <a href={contactDetails.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm transition-colors" style={{ color: '#475569' }}>
                            <Globe className="w-4 h-4" style={{ color: '#EC4899' }} /> {contactDetails.website}
                          </a>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-center py-1" style={{ color: '#94a3b8' }}>{t('contactNotAvailable')}</p>
                    )}
                  </div>
                )}

                {/* Save + Share */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleFavorite}
                    disabled={isSavingFavorite || isCheckingFavorite}
                    className="py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={isFavorite
                      ? { background: 'linear-gradient(90deg, #9D174D, #EC4899)', color: 'white', border: '1px solid transparent' }
                      : { background: 'transparent', color: '#EC4899', border: '1px solid #EC4899' }
                    }
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    {isSavingFavorite ? t('saving') : isFavorite ? t('saved') : t('save')}
                  </button>
                  <button
                    onClick={handleShare}
                    className="py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    style={{ background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0' }}
                  >
                    <Share2 className="w-4 h-4" /> {t('share')}
                  </button>
                </div>
              </div>

              {/* ── Stats row ── */}
              {modelDetails && (() => {
                const statRows = [
                  modelDetails.age         && [t('statAge'),         `${modelDetails.age} ${t('yrsShort')}`],
                  modelDetails.height_cm   && [t('statHeight'),      `${modelDetails.height_cm} cm`],
                  modelDetails.weight_kg   && [t('statWeight'),      `${modelDetails.weight_kg} kg`],
                  modelDetails.bust_cm     && [t('statBust'),        `${modelDetails.bust_cm} cm`],
                  modelDetails.waist_cm    && [t('statWaist'),       `${modelDetails.waist_cm} cm`],
                  modelDetails.hip_cm      && [t('statHip'),         `${modelDetails.hip_cm} cm`],
                  modelDetails.hair_color  && [t('statHair'),        formatHairColor(modelDetails.hair_color)],
                  modelDetails.eye_color   && [t('statEyes'),        formatEyeColor(modelDetails.eye_color)],
                  modelDetails.ethnicity   && [t('statEthnicity'),   formatEthnicity(modelDetails.ethnicity)],
                  modelDetails.nationality && [t('statNationality'), modelDetails.nationality],
                  modelDetails.dress_size  && [t('statDress'),       modelDetails.dress_size.toUpperCase()],
                  modelDetails.gender      && [t('statGender'),      formatGender(modelDetails.gender)],
                ].filter(Boolean)
                if (!statRows.length) return null
                return (
                  <div style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    <div className="grid grid-cols-2">
                      {statRows.map(([label, val]: any, idx: number) => (
                        <div key={label} className="flex items-center justify-between px-5 py-2.5" style={{
                          borderBottom: idx < statRows.length - 2 ? '1px solid #f1f5f9' : 'none',
                          borderRight: idx % 2 === 0 ? '1px solid #f1f5f9' : 'none',
                        }}>
                          <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#94a3b8' }}>{label}</span>
                          <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    {modelDetails.special_characteristics && (
                      <div className="px-5 py-3" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <span className="text-[11px] uppercase tracking-widest font-medium block mb-1" style={{ color: '#94a3b8' }}>{t('statSpecial')}</span>
                        <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>{modelDetails.special_characteristics}</p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* ── Rates ── */}
            {rates.length > 0 && (() => {
              const incallRates = rates.filter((r: any) => r.rate_type === 'incall')
              const outcallRates = rates.filter((r: any) => r.rate_type === 'outcall')
              return (
                <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>{t('ratesTitle')}</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-100">
                    {/* Incall */}
                    <div>
                      <div className="px-4 py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#EC4899' }}>{t('incallTitle')}</span>
                      </div>
                      {incallRates.length > 0 ? incallRates.map((rate: any) => (
                        <div key={rate.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #f8fafc' }}>
                          <span className="text-xs" style={{ color: '#64748b' }}>{formatDuration(rate.duration)}</span>
                          <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{rate.amount} <span className="text-xs font-normal" style={{ color: '#94a3b8' }}>{rate.currency || 'CHF'}</span></span>
                        </div>
                      )) : (
                        <div className="px-4 py-4 text-xs" style={{ color: '#cbd5e1' }}>—</div>
                      )}
                    </div>
                    {/* Outcall */}
                    <div>
                      <div className="px-4 py-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#818CF8' }}>{t('outcallTitle')}</span>
                      </div>
                      {outcallRates.length > 0 ? outcallRates.map((rate: any) => (
                        <div key={rate.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #f8fafc' }}>
                          <span className="text-xs" style={{ color: '#64748b' }}>{formatDuration(rate.duration)}</span>
                          <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{rate.amount} <span className="text-xs font-normal" style={{ color: '#94a3b8' }}>{rate.currency || 'CHF'}</span></span>
                        </div>
                      )) : (
                        <div className="px-4 py-4 text-xs" style={{ color: '#cbd5e1' }}>—</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── About Me ── */}
            {modelDetails?.about_me && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>{t('aboutMeTitle')}</span>
                </div>
                <p className="px-5 py-4 whitespace-pre-wrap" style={{ color: '#475569' }}>{htmlToPlainText(modelDetails.about_me || '')}</p>
              </div>
            )}

            {/* ── Services ── */}
            {(services.length > 0 || (modelDetails?.other_services && String(modelDetails.other_services).trim().length > 0)) && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>{t('servicesTitle')}</span>
                </div>
                <div className="px-5 py-4">
                  {services.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {services.map((service: any) => (
                        <span key={service.id} className="text-xs px-3 py-1.5 font-medium rounded-md" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.2)' }}>
                          {service.service?.name || t('fallbackService')}
                        </span>
                      ))}
                    </div>
                  )}
                  {modelDetails?.services_for?.length > 0 && (
                    <div className={`${services.length > 0 ? 'mt-3 pt-3' : ''}`} style={{ borderTop: services.length > 0 ? '1px solid #f1f5f9' : undefined }}>
                      <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: '#94a3b8' }}>{t('servicesFor')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {modelDetails.services_for.map((sf: string, i: number) => (
                          <span key={i} className="text-xs px-3 py-1 rounded-md font-medium" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>{sf}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {modelDetails?.other_services && String(modelDetails.other_services).trim().length > 0 && (
                    <div
                      className={`${services.length > 0 || (modelDetails?.services_for?.length ?? 0) > 0 ? 'mt-3 pt-3' : ''}`}
                      style={{ borderTop: services.length > 0 || (modelDetails?.services_for?.length ?? 0) > 0 ? '1px solid #f1f5f9' : undefined }}
                    >
                      <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: '#94a3b8' }}>{t('servicesOther')}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#475569' }}>{String(modelDetails.other_services).trim()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Languages ── */}
            {languages.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>{t('languagesTitle')}</span>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {languages.map((lang: any) => {
                    const filled = levelToStarCount(lang.level)
                    const levelShort = formatLanguageLevel(lang.level)
                    return (
                      <div
                        key={lang.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                      >
                        <span className="text-sm font-semibold shrink-0" style={{ color: '#0f172a' }}>{lang.language}</span>
                        <div
                          className="flex items-center gap-0.5"
                          role="img"
                          aria-label={`${lang.language}: ${levelShort}`}
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <span
                              key={n}
                              className="relative group inline-flex"
                            >
                              <span
                                tabIndex={0}
                                title={languageStarTooltip(n)}
                                className="inline-flex rounded-sm outline-none cursor-default focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-1"
                              >
                                <Star
                                  className={`w-4 h-4 ${n <= filled ? 'text-amber-400' : 'text-slate-200'}`}
                                  fill="currentColor"
                                  strokeWidth={0}
                                  aria-hidden
                                />
                              </span>
                              <span
                                role="tooltip"
                                className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[min(260px,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border px-2.5 py-2 text-left text-[11px] leading-snug shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                                style={{
                                  background: '#ffffff',
                                  borderColor: '#e2e8f0',
                                  color: '#475569',
                                  boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                }}
                              >
                                {languageStarTooltip(n)}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Location & Availability ── */}
            {(() => {
              const liveLoc =
                modelDetails?.live_location_city
                  ? `${modelDetails.live_location_city}${modelDetails.live_location_postal_code ? ` (${modelDetails.live_location_postal_code})` : ''}`
                  : ''
              if (!modelDetails?.city && !liveLoc) return null
              return (
              <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>{t('locationTitle')}</span>
                </div>
                <div className="px-5 py-4">
                  {modelDetails.city && (
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold" style={{ color: '#0f172a' }}>
                        {modelDetails.city}
                        {modelDetails.zip_code && (
                          <span className="ml-1.5 text-xs font-semibold" style={{ color: '#64748b' }}>
                            ({modelDetails.zip_code})
                          </span>
                        )}
                      </p>
                      {(modelDetails.street || modelDetails.street_number) && (
                        <p className="text-sm" style={{ color: '#475569' }}>
                          {[modelDetails.street, modelDetails.street_number].filter(Boolean).join(' ')}
                        </p>
                      )}
                    </div>
                  )}
                  {liveLoc && (
                    <p
                      className={`text-sm font-semibold flex items-center gap-2 ${modelDetails.city ? 'mt-3' : ''}`}
                      style={{ color: '#059669' }}
                    >
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      {t('live', { location: liveLoc })}
                    </p>
                  )}
                  {(modelDetails?.incall_options?.length > 0 || modelDetails?.outcall_options?.length > 0) && (
                    <div className={modelDetails.city || liveLoc ? 'mt-3' : ''}>
                  {modelDetails?.incall_options?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {formatIncallOptions(modelDetails.incall_options).map((opt: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ background: 'rgba(236,72,153,0.08)', color: '#BE185D', border: '1px solid rgba(236,72,153,0.2)' }}>{t('incallLabel', { opt })}</span>
                      ))}
                    </div>
                  )}
                  {modelDetails?.outcall_options?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formatIncallOptions(modelDetails.outcall_options).map((opt: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>{t('outcallLabel', { opt })}</span>
                      ))}
                    </div>
                  )}
                    </div>
                  )}
                </div>
              </div>
              )
            })()}

            {/* ── Working Hours ── */}
            {workingHours.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>{t('availabilityTitle')}</span>
                </div>
                <div className="px-5 py-3">
                  {(() => {
                    const is24_7 = workingHours.length === 7 && workingHours.every((wh: any) =>
                      wh.start_time === '00:00:00' && wh.end_time === '23:59:00'
                    )
                    if (is24_7) return (
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-sm font-bold" style={{ color: '#059669' }}>{t('available247')}</span>
                      </div>
                    )
                    return (
                      <div>
                        {workingHours.map((wh: any) => (
                          <div key={wh.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f8fafc' }}>
                            <span className="text-xs" style={{ color: '#64748b' }}>{formatDayOfWeek(wh.day_of_week)}</span>
                            <span className="text-xs font-semibold" style={{ color: '#0f172a' }}>
                              {wh.start_time && wh.end_time ? `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}` : t('closedDay')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* ── Collaborations ── */}
            {collabModels.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <Handshake className="w-4 h-4" style={{ color: '#94a3b8' }} />
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>{t('collaborationsTitle')}</span>
                  <span className="text-[11px] font-bold ml-auto" style={{ color: '#cbd5e1' }}>({collabModels.length})</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {collabModels.map((model: any) => (
                      <Link
                        key={model.id}
                        href={`/models/${model.id}`}
                        className="group block rounded-lg overflow-hidden transition-all"
                        style={{ border: '1px solid #e2e8f0' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(236,72,153,0.3)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none' }}
                      >
                        <div className="relative aspect-[3/4]" style={{ background: '#f8fafc' }}>
                          {model.photoUrl ? (
                            <Image
                              src={model.photoUrl}
                              alt={model.showname || model.username}
                              fill
                              className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                              sizes="(max-width: 640px) 45vw, 180px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="w-8 h-8" style={{ color: '#cbd5e1' }} />
                            </div>
                          )}
                          {model.is_verified && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-sm font-bold truncate group-hover:text-pink-500 transition-colors" style={{ color: '#0f172a' }}>
                            {model.showname || model.username}
                          </p>
                          {(model.city || model.age) && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: '#94a3b8' }}>
                              {[model.age ? `${model.age} ${t('yrsShort')}` : '', model.city].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Reviews ── */}
            {(() => {
              const otherComments = comments?.filter((c: any) => c.user?.id !== currentUserId) || []
              return isLoggedIn && otherComments.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>{t('reviewsTitle')}</span>
                    <span className="text-[11px] font-bold" style={{ color: '#cbd5e1' }}>({otherComments.length})</span>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {otherComments.map((comment: any) => (
                      <div key={comment.id} className="pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-sm font-bold" style={{ color: '#0f172a' }}>{comment.user.username || t('anonymousAuthor')}</span>
                          {comment.rating && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: comment.rating }).map((_: any, i: number) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] mb-2" style={{ color: '#94a3b8' }}>
                          {new Date(comment.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{comment.comment_text}</p>

                        {/* Model reply */}
                        {comment.reply_text && (
                          <div className="mt-3 ml-4 pl-3" style={{ borderLeft: '2px solid rgba(236,72,153,0.4)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#EC4899' }}>
                                {t('modelRepliedLabel', { name: modelDetails?.showname || profile?.username || t('fallbackModel') })}
                              </span>
                              {comment.replied_at && (
                                <span className="text-[10px]" style={{ color: '#94a3b8' }}>
                                  · {new Date(comment.replied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{comment.reply_text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── Leave a review ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: '#94a3b8' }}>
                  {myComment ? t('yourReview') : t('leaveReview')}
                </span>
              </div>
              <div className="px-5 py-4">
              {myComment ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      myComment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      myComment.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {myComment.status === 'approved' ? t('statusPublished') : myComment.status === 'rejected' ? t('statusRemoved') : t('statusPublished')}
                    </span>
                    <p className="text-xs" style={{ color: '#94a3b8' }}>
                      {new Date(myComment.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  {myComment.rating && (
                    <div className="flex gap-0.5 mb-2">
                      {Array.from({ length: myComment.rating }).map((_: any, i: number) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{myComment.comment_text}</p>
                </div>
              ) : (
                <div>
                  {commentSuccess && (
                    <div className="mb-3 p-3 rounded-md text-sm font-medium" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#059669' }}>
                      {t('reviewPublished')}
                    </div>
                  )}
                  {!showCommentForm ? (
                    <>
                      <p className="text-sm mb-3" style={{ color: '#94a3b8' }}>{t('shareExperience')}</p>
                      <button
                        onClick={() => {
                          const supabase = createClient()
                          supabase.auth.getUser().then(({ data: { user } }) => {
                            if (!user) setShowCommentLoginModal(true)
                            else setShowCommentForm(true)
                          })
                        }}
                        className="w-full py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                      >
                        <MessageCircle className="w-4 h-4" /> {t('writeReview')}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setCommentRating(star)}
                            className={`text-2xl transition-colors ${star <= commentRating ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'}`}>
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={t('sharePlaceholder')}
                        rows={4}
                        maxLength={1000}
                        className="w-full px-3 py-2.5 text-sm rounded-md focus:outline-none resize-none"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a' }}
                      />
                      <p className="text-xs text-right" style={{ color: '#94a3b8' }}>{commentText.length} / 1000</p>
                      <div className="flex gap-2">
                        <button
                          onClick={submitComment}
                          disabled={submittingComment || !commentText.trim()}
                          className="flex-1 py-2.5 text-sm font-bold rounded-md transition-all disabled:opacity-50"
                          style={{ background: 'linear-gradient(90deg, #9D174D, #EC4899)', color: 'white' }}
                        >
                          {submittingComment ? t('submitting') : t('submit')}
                        </button>
                        <button
                          onClick={() => { setShowCommentForm(false); setCommentText(''); setCommentRating(0) }}
                          className="px-4 py-2.5 text-sm font-semibold rounded-md transition-colors"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                        >
                          {t('cancel')}
                        </button>
                      </div>
                      <p className="text-xs" style={{ color: '#94a3b8' }}>{t('reviewWillBePublished')}</p>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>

          </div>

          {/* Right Column - sticky media viewer (photos + videos) */}
          <div className="order-1 lg:order-2">

            {/* ── Quick Action Panel – only for logged-in models & clubs ── */}
            {isLoggedIn && currentUserId !== profile.id &&
              (currentUserRole === 'model' || currentUserRole === 'company') &&
              collabStatus !== 'loading' && clubInviteStatus !== 'loading' && (
              <div
                className="mb-3 rounded-xl p-4"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <p className="text-[10px] uppercase tracking-widest font-bold mb-3 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
                  {currentUserRole === 'model'
                    ? <><Handshake className="w-3 h-3" /> {t('quickCollaboration')}</>
                    : <><Users className="w-3 h-3" /> {t('clubInvite')}</>
                  }
                </p>

                {/* Model → Collaborate */}
                {currentUserRole === 'model' && (
                  <>
                    {collabStatus === 'accepted' ? (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <Handshake className="w-4 h-4" /> {t('alreadyCollaborating')}
                      </div>
                    ) : collabStatus === 'pending_sent' ? (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <Clock className="w-4 h-4" /> {t('requestSent')}
                      </div>
                    ) : collabStatus === 'pending_received' ? (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Handshake className="w-4 h-4" /> {t('theySentRequest')}
                      </div>
                    ) : (
                      <button
                        onClick={sendCollabRequest}
                        disabled={sendingInvite}
                        className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                        style={{
                          background: 'linear-gradient(90deg, #9D174D, #EC4899)',
                          color: 'white',
                          boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
                        }}
                      >
                        <Handshake className="w-4 h-4" />
                        {sendingInvite ? t('sending') : t('inviteToCollaborate')}
                      </button>
                    )}
                  </>
                )}

                {/* Club → Invite to club */}
                {currentUserRole === 'company' && (
                  <>
                    {clubInviteStatus === 'accepted' ? (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold" style={{ background: 'rgba(16,185,129,0.15)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.25)' }}>
                        <CheckCircle className="w-4 h-4" /> {t('alreadyInClub')}
                      </div>
                    ) : clubInviteStatus === 'pending' ? (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <Clock className="w-4 h-4" /> {t('inviteSent')}
                      </div>
                    ) : (
                      <button
                        onClick={sendClubInvite}
                        disabled={sendingInvite}
                        className="w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                        style={{
                          background: 'linear-gradient(90deg, #9D174D, #EC4899)',
                          color: 'white',
                          boxShadow: '0 4px 16px rgba(236,72,153,0.35)',
                        }}
                      >
                        <Users className="w-4 h-4" />
                        {sendingInvite ? t('sending') : t('inviteToMyClub')}
                      </button>
                    )}
                  </>
                )}

                {inviteSuccess && (
                  <p className="mt-2.5 text-xs font-semibold text-center" style={{ color: '#4ade80' }}>{inviteSuccess}</p>
                )}
                {inviteError && (
                  <p className="mt-2.5 text-xs font-semibold text-center" style={{ color: '#f87171' }}>{inviteError}</p>
                )}
              </div>
            )}

            <div
              className="relative lg:sticky lg:top-[125px] overflow-hidden rounded-lg bg-black h-[65vh] lg:h-[75vh]"
              onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return
                const dx = e.changedTouches[0].clientX - touchStartX.current
                touchStartX.current = null
                if (Math.abs(dx) < 40) return
                if (dx < 0) setSelectedPhotoIndex(prev => (prev + 1) % mediaItems.length)
                else setSelectedPhotoIndex(prev => (prev - 1 + mediaItems.length) % mediaItems.length)
              }}
            >
              {mediaItems.length > 0 ? (
                <>
                  {mediaItems[selectedPhotoIndex]?.type === 'video' ? (
                    <video
                      key={mediaItems[selectedPhotoIndex].url}
                      src={mediaItems[selectedPhotoIndex].url}
                      className="absolute inset-0 w-full h-full object-contain"
                      controls
                      playsInline
                    />
                  ) : (
                    <Image
                      src={mediaItems[selectedPhotoIndex]?.url || ''}
                      alt={modelDetails?.showname || profile.username}
                      fill
                      sizes="(max-width: 768px) 100vw, 550px"
                      className="object-cover object-top cursor-zoom-in transition-opacity duration-300"
                      priority
                      quality={82}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBAAFERIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aqd2uUi3zVNNJSpCk5BKiQc+eMCrLSLFHiulDzilEeKlE4/p4oopVJGKXY//Z"
                      onClick={() => { setLightboxIndex(selectedPhotoIndex); setLightboxOpen(true) }}
                    />
                  )}

                  {mediaItems.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedPhotoIndex(prev => prev === 0 ? mediaItems.length - 1 : prev - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-full transition-all z-10"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setSelectedPhotoIndex(prev => prev === mediaItems.length - 1 ? 0 : prev + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2.5 rounded-full transition-all z-10"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Like button for photos */}
                  {mediaItems[selectedPhotoIndex]?.type === 'photo' && mediaItems[selectedPhotoIndex]?.id && (
                    <button
                      onClick={() => togglePhotoLike(mediaItems[selectedPhotoIndex].id!)}
                      disabled={likingPhoto === mediaItems[selectedPhotoIndex].id}
                      className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-3 py-2 rounded-full transition-all group/like"
                      style={{
                        background: likedPhotos.has(mediaItems[selectedPhotoIndex].id!)
                          ? 'rgba(236,72,153,0.85)'
                          : 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Heart
                        className={`w-5 h-5 transition-all ${
                          likedPhotos.has(mediaItems[selectedPhotoIndex].id!)
                            ? 'fill-white text-white'
                            : 'text-white group-hover/like:text-pink-300'
                        } ${heartPop && likedPhotos.has(mediaItems[selectedPhotoIndex].id!) ? 'scale-125' : 'scale-100'}`}
                        style={{ transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                      />
                      <span className="text-white text-sm font-semibold min-w-[1ch]">
                        {photoLikeCounts[mediaItems[selectedPhotoIndex].id!] || 0}
                      </span>
                    </button>
                  )}

                  <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
                    {mediaItems[selectedPhotoIndex]?.type === 'video' && (
                      <span className="bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {t('videoBadge')}
                      </span>
                    )}
                    {mediaItems.length > 1 && (
                      <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {selectedPhotoIndex + 1} / {mediaItems.length}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Sparkles className="w-20 h-20 text-gray-300" />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Share Toast */}
      {showShareToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="font-medium">{t('linkCopiedToClipboard')}</span>
        </div>
      )}

      {/* Comment Login Modal */}
      {showCommentLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowCommentLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Comment icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              {t('loginModalCommentTitle')}
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center mb-8">
              {t('loginModalCommentMessage')}
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <Link
                href={`/register?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all shadow-lg text-center"
              >
                {t('createAccount')}
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="block w-full py-3 px-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-all text-center"
              >
                {t('logIn')}
              </Link>
            </div>

            {/* Additional info */}
            <p className="text-xs text-gray-500 text-center mt-6">
              {t('loginModalCommentExtra')}
            </p>
          </div>
        </div>
      )}

      {/* Favorites Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Heart icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-pink-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              {t('loginModalFavoriteTitle')}
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center mb-8">
              {t('loginModalFavoriteMessage')}
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <Link
                href={`/register?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="block w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-lg transition-all shadow-lg text-center"
              >
                {t('createAccount')}
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="block w-full py-3 px-4 border-2 border-pink-600 text-pink-600 hover:bg-pink-50 font-bold rounded-lg transition-all text-center"
              >
                {t('logIn')}
              </Link>
            </div>

            {/* Additional info */}
            <p className="text-xs text-gray-500 text-center mt-6">
              {t('loginModalFavoriteExtra')}
            </p>
          </div>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightboxOpen(false)}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return
            const dx = e.changedTouches[0].clientX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(dx) < 40) return
            e.stopPropagation()
            if (dx < 0) setLightboxIndex(i => (i + 1) % mediaItems.length)
            else setLightboxIndex(i => (i - 1 + mediaItems.length) % mediaItems.length)
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-white transition-all z-10"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium">
            {lightboxIndex + 1} / {mediaItems.length}
          </div>

          {/* Prev arrow */}
          {mediaItems.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + mediaItems.length) % mediaItems.length) }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full text-white transition-all z-10"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <ChevronLeft className="w-7 h-7" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full flex items-center justify-center px-20"
            onClick={e => e.stopPropagation()}
          >
            {mediaItems[lightboxIndex]?.type === 'video' ? (
              <video
                src={mediaItems[lightboxIndex].url}
                className="max-h-[90vh] max-w-full rounded-lg"
                controls
                autoPlay
              />
            ) : (
              <div className="relative" style={{ maxWidth: '90vw', maxHeight: '90vh', width: '100%', height: '90vh' }}>
                <Image
                  src={mediaItems[lightboxIndex]?.url || ''}
                  alt={modelDetails?.showname || profile.username}
                  fill
                  sizes="90vw"
                  className="object-contain"
                  priority
                />
              </div>
            )}
          </div>

          {/* Next arrow */}
          {mediaItems.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % mediaItems.length) }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full text-white transition-all z-10"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <ChevronRight className="w-7 h-7" />
            </button>
          )}

          {/* Like button in lightbox */}
          {mediaItems[lightboxIndex]?.type === 'photo' && mediaItems[lightboxIndex]?.id && (
            <button
              onClick={e => { e.stopPropagation(); togglePhotoLike(mediaItems[lightboxIndex].id!) }}
              disabled={likingPhoto === mediaItems[lightboxIndex].id}
              className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full transition-all"
              style={{
                background: likedPhotos.has(mediaItems[lightboxIndex].id!)
                  ? 'rgba(236,72,153,0.85)'
                  : 'rgba(255,255,255,0.12)',
              }}
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  likedPhotos.has(mediaItems[lightboxIndex].id!)
                    ? 'fill-white text-white'
                    : 'text-white/70 hover:text-pink-300'
                }`}
              />
              <span className="text-white text-sm font-semibold">
                {photoLikeCounts[mediaItems[lightboxIndex].id!] || 0}
              </span>
            </button>
          )}

          {/* Thumbnail strip */}
          {mediaItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {mediaItems.map((item, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i) }}
                  className="transition-all rounded overflow-hidden flex-shrink-0"
                  style={{
                    width: i === lightboxIndex ? '40px' : '28px',
                    height: i === lightboxIndex ? '40px' : '28px',
                    opacity: i === lightboxIndex ? 1 : 0.5,
                    border: i === lightboxIndex ? '2px solid white' : '2px solid transparent',
                    position: 'relative',
                  }}
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z"/></svg>
                    </div>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
