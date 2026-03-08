'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
  } = modelData

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showContact, setShowContact] = useState(false)
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
      // Only block form if comment exists and is pending or approved (not rejected)
      setHasExistingComment(data.status === 'pending' || data.status === 'approved')
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)' }}>

      {/* ── Floating prev/next nav ── */}
      {allModelIds.length > 1 && (
        <>
          {/* PREV */}
          <button
            onClick={goToPrev}
            aria-label="Previous model"
            className="fixed left-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 group"
            style={{
              width: 48, height: 96,
              background: 'rgba(31,33,38,0.92)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(157,23,77,0.95)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(236,72,153,0.4)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(31,33,38,0.92)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.35)', writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.15em' }}>prev</span>
          </button>

          {/* NEXT */}
          <button
            onClick={goToNext}
            aria-label="Next model"
            className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 group"
            style={{
              width: 48, height: 96,
              background: 'rgba(31,33,38,0.92)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(157,23,77,0.95)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(236,72,153,0.4)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(31,33,38,0.92)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-[9px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.35)', writingMode: 'vertical-rl', letterSpacing: '0.15em' }}>next</span>
            <ChevronRight className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
          </button>
        </>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white hover:text-white/80 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to all models</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_550px] gap-8">
          {/* Left Column - info */}
          <div className="space-y-3">

            {/* ── Hero card ── */}
            <div className="rounded-xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
              {/* Dark header */}
              <div className="px-6 pt-6 pb-5" style={{ background: '#1f2126' }}>

                {/* Name + verified */}
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h1 className="text-3xl font-bold leading-tight tracking-tight" style={{ color: '#ffffff' }}>
                    {modelDetails?.showname || profile.username}
                  </h1>
                  {profile.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-1 rounded-full shrink-0 mt-1" style={{ background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' }}>
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                {/* City / age line */}
                <div className="flex items-center gap-3 mb-3">
                  {modelDetails?.city && (
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {modelDetails.city}
                    </span>
                  )}
                  {modelDetails?.age && modelDetails?.city && (
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  )}
                  {modelDetails?.age && (
                    <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {modelDetails.age} years
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
                    <Phone className="w-4 h-4" /> Show Contact
                  </button>
                ) : (
                  <div className="mb-3 p-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {contactDetails ? (
                      <div className="space-y-2.5">
                        {contactDetails.show_phone_number && contactDetails.phone_number && (
                          <div>
                            <a
                              href={`tel:${contactDetails.country_code || ''}${contactDetails.phone_number}`}
                              className="text-2xl font-bold transition-colors"
                              style={{ color: '#F472B6' }}
                            >
                              {contactDetails.country_code || ''} {contactDetails.phone_number}
                            </a>
                            {(contactDetails.has_whatsapp || contactDetails.has_viber || contactDetails.has_telegram) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {contactDetails.has_whatsapp && <span className="text-xs px-2.5 py-1 font-semibold rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>WhatsApp</span>}
                                {contactDetails.has_viber && <span className="text-xs px-2.5 py-1 font-semibold rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>Viber</span>}
                                {contactDetails.has_telegram && <span className="text-xs px-2.5 py-1 font-semibold rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>Telegram</span>}
                              </div>
                            )}
                          </div>
                        )}
                        {contactDetails.email && (
                          <a href={`mailto:${contactDetails.email}`} className="flex items-center gap-2 text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            <Mail className="w-4 h-4" style={{ color: '#EC4899' }} /> {contactDetails.email}
                          </a>
                        )}
                        {contactDetails.website && (
                          <a href={contactDetails.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm transition-colors" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            <Globe className="w-4 h-4" style={{ color: '#EC4899' }} /> {contactDetails.website}
                          </a>
                        )}
                        {contactDetails.contact_instruction && (
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{contactDetails.contact_instruction.replace(/_/g, ' ')}</p>
                        )}
                        {contactDetails.no_withheld_numbers && (
                          <p className="text-xs font-semibold" style={{ color: '#f87171' }}>No withheld numbers accepted</p>
                        )}
                        {!contactDetails.phone_number && !contactDetails.email && !contactDetails.website && (
                          <p className="text-sm text-center py-1" style={{ color: 'rgba(255,255,255,0.4)' }}>No contact details provided yet</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-center py-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Contact information not available</p>
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
                    {isSavingFavorite ? 'Saving…' : isFavorite ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                    style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              {/* ── Stats row ── */}
              {modelDetails && (() => {
                const statRows = [
                  modelDetails.age         && ['Age',         `${modelDetails.age} yrs`],
                  modelDetails.height_cm   && ['Height',      `${modelDetails.height_cm} cm`],
                  modelDetails.weight_kg   && ['Weight',      `${modelDetails.weight_kg} kg`],
                  modelDetails.bust_cm     && ['Bust',        `${modelDetails.bust_cm} cm`],
                  modelDetails.waist_cm    && ['Waist',       `${modelDetails.waist_cm} cm`],
                  modelDetails.hip_cm      && ['Hip',         `${modelDetails.hip_cm} cm`],
                  modelDetails.hair_color  && ['Hair',        formatHairColor(modelDetails.hair_color)],
                  modelDetails.eye_color   && ['Eyes',        formatEyeColor(modelDetails.eye_color)],
                  modelDetails.ethnicity   && ['Ethnicity',   formatEthnicity(modelDetails.ethnicity)],
                  modelDetails.nationality && ['Nationality', modelDetails.nationality],
                  modelDetails.dress_size  && ['Dress',       modelDetails.dress_size.toUpperCase()],
                  modelDetails.gender      && ['Gender',      formatGender(modelDetails.gender)],
                ].filter(Boolean)
                if (!statRows.length) return null
                return (
                  <div style={{ background: '#16181d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="grid grid-cols-2">
                      {statRows.map(([label, val]: any, idx: number) => (
                        <div key={label} className="flex items-center justify-between px-5 py-2.5" style={{
                          borderBottom: idx < statRows.length - 2 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          borderRight: idx % 2 === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}>
                          <span className="text-[11px] uppercase tracking-widest font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    {modelDetails.special_characteristics && (
                      <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span className="text-[11px] uppercase tracking-widest font-medium block mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Special</span>
                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{modelDetails.special_characteristics}</p>
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
                <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                  <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Rates</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                    {/* Incall */}
                    <div>
                      <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#EC4899' }}>Incall</span>
                      </div>
                      {incallRates.length > 0 ? incallRates.map((rate: any) => (
                        <div key={rate.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{formatDuration(rate.duration)}</span>
                          <span className="text-sm font-bold" style={{ color: 'white' }}>{rate.amount} <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>{rate.currency || 'CHF'}</span></span>
                        </div>
                      )) : (
                        <div className="px-4 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>—</div>
                      )}
                    </div>
                    {/* Outcall */}
                    <div>
                      <div className="px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#818CF8' }}>Outcall</span>
                      </div>
                      {outcallRates.length > 0 ? outcallRates.map((rate: any) => (
                        <div key={rate.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{formatDuration(rate.duration)}</span>
                          <span className="text-sm font-bold" style={{ color: 'white' }}>{rate.amount} <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.4)' }}>{rate.currency || 'CHF'}</span></span>
                        </div>
                      )) : (
                        <div className="px-4 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>—</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* ── About Me ── */}
            {modelDetails?.about_me && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>About me</span>
                </div>
                <div className="px-5 py-4 rich-text-content rich-text-light" dangerouslySetInnerHTML={{ __html: modelDetails.about_me }} />
              </div>
            )}

            {/* ── Services ── */}
            {services.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Services</span>
                </div>
                <div className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {services.map((service: any) => (
                      <span key={service.id} className="text-xs px-3 py-1.5 font-medium rounded-md" style={{ background: 'rgba(236,72,153,0.12)', color: '#F472B6', border: '1px solid rgba(236,72,153,0.2)' }}>
                        {service.service?.name || 'Service'}
                      </span>
                    ))}
                  </div>
                  {modelDetails?.services_for?.length > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[11px] uppercase tracking-widest font-bold mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>For</p>
                      <div className="flex flex-wrap gap-1.5">
                        {modelDetails.services_for.map((sf: string, i: number) => (
                          <span key={i} className="text-xs px-3 py-1 rounded-md font-medium" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>{sf}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Languages ── */}
            {languages.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Languages</span>
                </div>
                <div className="px-5 py-4 flex flex-wrap gap-2">
                  {languages.map((lang: any) => (
                    <div key={lang.id} className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{lang.language}</span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{formatLanguageLevel(lang.level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Location & Availability ── */}
            {modelDetails?.city && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Location</span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm font-bold mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>{modelDetails.city}</p>
                  {modelDetails?.incall_options?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {formatIncallOptions(modelDetails.incall_options).map((opt: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ background: 'rgba(236,72,153,0.12)', color: '#F472B6', border: '1px solid rgba(236,72,153,0.2)' }}>Incall: {opt}</span>
                      ))}
                    </div>
                  )}
                  {modelDetails?.outcall_options?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {formatIncallOptions(modelDetails.outcall_options).map((opt: string, i: number) => (
                        <span key={i} className="text-xs px-2.5 py-1 rounded-md font-medium" style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}>Outcall: {opt}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Working Hours ── */}
            {workingHours.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Availability</span>
                </div>
                <div className="px-5 py-3">
                  {(() => {
                    const is24_7 = workingHours.length === 7 && workingHours.every((wh: any) =>
                      wh.start_time === '00:00:00' && wh.end_time === '23:59:00'
                    )
                    if (is24_7) return (
                      <div className="flex items-center gap-2 py-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-sm font-bold" style={{ color: '#4ade80' }}>Available 24 / 7</span>
                      </div>
                    )
                    return (
                      <div>
                        {workingHours.map((wh: any) => (
                          <div key={wh.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{formatDayOfWeek(wh.day_of_week)}</span>
                            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              {wh.start_time && wh.end_time ? `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}` : 'Closed'}
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
              <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <Handshake className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                  <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Collaborations</span>
                  <span className="text-[11px] font-bold ml-auto" style={{ color: 'rgba(255,255,255,0.2)' }}>({collabModels.length})</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {collabModels.map((model: any) => (
                      <Link
                        key={model.id}
                        href={`/models/${model.id}`}
                        className="group block rounded-lg overflow-hidden transition-all"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(236,72,153,0.3)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none' }}
                      >
                        <div className="relative aspect-[3/4]" style={{ background: 'rgba(255,255,255,0.05)' }}>
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
                              <Sparkles className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
                            </div>
                          )}
                          {model.is_verified && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-sm font-bold truncate group-hover:text-pink-400 transition-colors" style={{ color: 'rgba(255,255,255,0.85)' }}>
                            {model.showname || model.username}
                          </p>
                          {(model.city || model.age) && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {[model.age ? `${model.age} yrs` : '', model.city].filter(Boolean).join(' · ')}
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
                <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                  <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Reviews</span>
                    <span className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>({otherComments.length})</span>
                  </div>
                  <div className="px-5 py-4 space-y-4">
                    {otherComments.map((comment: any) => (
                      <div key={comment.id} className="pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>{comment.user.username || 'Anonymous'}</span>
                          {comment.rating && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: comment.rating }).map((_: any, i: number) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {new Date(comment.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{comment.comment_text}</p>

                        {/* Model reply */}
                        {comment.reply_text && (
                          <div className="mt-3 ml-4 pl-3" style={{ borderLeft: '2px solid rgba(236,72,153,0.3)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#EC4899' }}>
                                {modelDetails?.showname || profile?.username || 'Model'} replied
                              </span>
                              {comment.replied_at && (
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                  · {new Date(comment.replied_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{comment.reply_text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── Leave a review ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {myComment ? 'Your review' : 'Leave a review'}
                </span>
              </div>
              <div className="px-5 py-4">
              {myComment ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      myComment.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      myComment.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {myComment.status === 'approved' ? 'Published' : myComment.status === 'rejected' ? 'Removed' : 'Published'}
                    </span>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{myComment.comment_text}</p>
                </div>
              ) : (
                <div>
                  {commentSuccess && (
                    <div className="mb-3 p-3 rounded-md text-sm font-medium" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#4ade80' }}>
                      Your review has been published!
                    </div>
                  )}
                  {!showCommentForm ? (
                    <>
                      <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Share your experience with this model.</p>
                      <button
                        onClick={() => {
                          const supabase = createClient()
                          supabase.auth.getUser().then(({ data: { user } }) => {
                            if (!user) setShowCommentLoginModal(true)
                            else setShowCommentForm(true)
                          })
                        }}
                        className="w-full py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                        style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}
                      >
                        <MessageCircle className="w-4 h-4" /> Write a review
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setCommentRating(star)}
                            className={`text-2xl transition-colors ${star <= commentRating ? 'text-amber-400' : 'text-gray-600 hover:text-amber-300'}`}>
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Share your experience…"
                        rows={4}
                        maxLength={1000}
                        className="w-full px-3 py-2.5 text-sm rounded-md focus:outline-none resize-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)' }}
                      />
                      <p className="text-xs text-right" style={{ color: 'rgba(255,255,255,0.3)' }}>{commentText.length} / 1000</p>
                      <div className="flex gap-2">
                        <button
                          onClick={submitComment}
                          disabled={submittingComment || !commentText.trim()}
                          className="flex-1 py-2.5 text-sm font-bold rounded-md transition-all disabled:opacity-50"
                          style={{ background: 'linear-gradient(90deg, #9D174D, #EC4899)', color: 'white' }}
                        >
                          {submittingComment ? 'Submitting…' : 'Submit'}
                        </button>
                        <button
                          onClick={() => { setShowCommentForm(false); setCommentText(''); setCommentRating(0) }}
                          className="px-4 py-2.5 text-sm font-semibold rounded-md transition-colors"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Your review will be published immediately.</p>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>

          </div>

          {/* Right Column - sticky media viewer (photos + videos) */}
          <div>
            <div
              className="sticky top-[125px] relative overflow-hidden rounded-lg bg-black"
              style={{ height: '75vh' }}
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
                        VIDEO
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
          <span className="font-medium">Link copied to clipboard!</span>
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
              Leave a Comment
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center mb-8">
              You need to be logged in to leave a comment. Create an account or log in to share your experience.
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <Link
                href={`/register?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all shadow-lg text-center"
              >
                Create Account
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="block w-full py-3 px-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-all text-center"
              >
                Log In
              </Link>
            </div>

            {/* Additional info */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Share your experience with this model to help others make informed decisions.
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
              Save to Favorites
            </h2>

            {/* Message */}
            <p className="text-gray-600 text-center mb-8">
              You need to be logged in to save models to your favorites. Create an account or log in to continue.
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <Link
                href={`/register?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="block w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-lg transition-all shadow-lg text-center"
              >
                Create Account
              </Link>
              <Link
                href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="block w-full py-3 px-4 border-2 border-pink-600 text-pink-600 hover:bg-pink-50 font-bold rounded-lg transition-all text-center"
              >
                Log In
              </Link>
            </div>

            {/* Additional info */}
            <p className="text-xs text-gray-500 text-center mt-6">
              Create a free account to access favorites, leave comments, and more.
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
