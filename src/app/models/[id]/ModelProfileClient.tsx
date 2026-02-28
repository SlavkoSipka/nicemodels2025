'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackModelAction, trackProfileView } from '@/lib/tracking'
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
  Star
} from 'lucide-react'

interface ModelProfileClientProps {
  modelData: any
}

export default function ModelProfileClient({ modelData }: ModelProfileClientProps) {
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
    comments
  } = modelData

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
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
  const router = useRouter()

  // Check if model is already favorited and if user has existing comment
  useEffect(() => {
    checkIfFavorite()
    checkExistingComment()
    checkIfLoggedIn()
    // Track profile view
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
        status: 'pending'
      })

    if (!error) {
      setCommentSuccess(true)
      setCommentText('')
      setCommentRating(0)
      setShowCommentForm(false)
      setHasExistingComment(true)
      
      // Refetch user's comment to display it
      await checkExistingComment()
      
      // Hide success message after 5 seconds
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

  // Build unified media list: photos first, then videos
  const mediaItems: { type: 'photo' | 'video'; url: string }[] = [
    ...photos
      .map((photo: any) => {
        if (!photo.file_path) return null
        return {
          type: 'photo' as const,
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

        <div className="grid grid-cols-1 lg:grid-cols-[550px_1fr] gap-8">
          {/* Left Column - sticky media viewer (photos + videos) */}
          <div>
            <div
              className="sticky top-[125px] relative overflow-hidden rounded-lg bg-black"
              style={{ height: '75vh' }}
            >
              {mediaItems.length > 0 ? (
                <>
                  {/* Current media item */}
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
                      className="object-cover object-top"
                      priority
                    />
                  )}

                  {/* Navigation arrows */}
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

                  {/* Counter + video badge */}
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

          {/* Right Column */}
          <div className="space-y-4">

            {/* ── Hero info card ── */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
              {/* colored top bar */}
              <div className="h-1.5 bg-gradient-to-r from-brand via-rose-400 to-pink-300" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                    {modelDetails?.showname || profile.username}
                  </h1>
                  {profile.is_verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-500 px-2.5 py-1 rounded-full shrink-0 shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                {modelDetails?.slogan && (
                  <p className="text-sm text-brand/80 italic mb-3">"{modelDetails.slogan}"</p>
                )}

                {/* key stats row */}
                <div className="flex flex-wrap gap-3 mb-5">
                  {modelDetails?.city && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full px-3 py-1">
                      <MapPin className="w-3.5 h-3.5 text-brand" /> {modelDetails.city}
                    </span>
                  )}
                  {modelDetails?.age && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full px-3 py-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" /> {modelDetails.age} yrs
                    </span>
                  )}
                  {photos.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-full px-3 py-1">
                      <ImageIcon className="w-3.5 h-3.5 text-purple-500" /> {photos.length} photos
                    </span>
                  )}
                </div>

                {/* Contact reveal */}
                {!showContact ? (
                  <button
                    onClick={handleShowContact}
                    className="w-full py-3 bg-gradient-to-r from-brand to-rose-500 hover:from-brand-hover hover:to-rose-600 text-white font-bold rounded-md transition-all shadow-md flex items-center justify-center gap-2 mb-3"
                  >
                    <Phone className="w-4 h-4" /> Show Contact
                  </button>
                ) : (
                  <div className="mb-3 p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                    {contactDetails ? (
                      <div className="space-y-2.5">
                        {contactDetails.show_phone_number && contactDetails.phone_number && (
                          <div>
                            <a
                              href={`tel:${contactDetails.country_code || ''}${contactDetails.phone_number}`}
                              className="text-2xl font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                            >
                              {contactDetails.country_code || ''} {contactDetails.phone_number}
                            </a>
                            {(contactDetails.has_whatsapp || contactDetails.has_viber || contactDetails.has_telegram) && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {contactDetails.has_whatsapp && <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-semibold rounded-full">WhatsApp</span>}
                                {contactDetails.has_viber && <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 font-semibold rounded-full">Viber</span>}
                                {contactDetails.has_telegram && <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-700 font-semibold rounded-full">Telegram</span>}
                              </div>
                            )}
                          </div>
                        )}
                        {contactDetails.email && (
                          <a href={`mailto:${contactDetails.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand">
                            <Mail className="w-4 h-4 text-brand" /> {contactDetails.email}
                          </a>
                        )}
                        {contactDetails.website && (
                          <a href={contactDetails.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 hover:text-brand">
                            <Globe className="w-4 h-4 text-brand" /> {contactDetails.website}
                          </a>
                        )}
                        {contactDetails.contact_instruction && (
                          <p className="text-xs text-gray-500">{contactDetails.contact_instruction.replace(/_/g, ' ')}</p>
                        )}
                        {contactDetails.no_withheld_numbers && (
                          <p className="text-xs text-red-600 font-semibold">No withheld numbers accepted</p>
                        )}
                        {!contactDetails.phone_number && !contactDetails.email && !contactDetails.website && (
                          <p className="text-sm text-gray-500 text-center py-1">No contact details provided yet</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-1">Contact information not available</p>
                    )}
                  </div>
                )}

                {/* Save + Share */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleFavorite}
                    disabled={isSavingFavorite || isCheckingFavorite}
                    className={`py-2.5 text-sm font-bold rounded-md border-2 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                      isFavorite
                        ? 'bg-brand border-brand text-white shadow-md'
                        : 'border-brand text-brand hover:bg-brand hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    {isSavingFavorite ? 'Saving…' : isFavorite ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="py-2.5 text-sm font-bold rounded-md border-2 border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>
            </div>

            {/* ── Reviews ── */}
            {(() => {
              const otherComments = comments?.filter((c: any) => c.user?.id !== currentUserId) || []
              return isLoggedIn && otherComments.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">Reviews <span className="text-gray-400 font-normal">({otherComments.length})</span></p>
                  </div>
                  <div className="space-y-4">
                    {otherComments.map((comment: any) => (
                      <div key={comment.id} className="bg-gray-50 rounded-md p-4">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-bold text-gray-900">{comment.user.username || 'Anonymous'}</span>
                          {comment.rating && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: comment.rating }).map((_: any, i: number) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">
                          {new Date(comment.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-700 leading-relaxed">{comment.comment_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── Leave a review ── */}
            <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-white/80" />
                  <p className="text-sm font-bold text-white">
                    {myComment ? 'Your review' : 'Leave a review'}
                  </p>
                </div>
              </div>
              <div className="p-5">
              {myComment ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      myComment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      myComment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {myComment.status === 'pending' ? 'Pending review' : myComment.status === 'approved' ? 'Approved' : 'Not approved'}
                    </span>
                    <p className="text-xs text-gray-400">
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
                  <p className="text-sm text-gray-700 leading-relaxed">{myComment.comment_text}</p>
                </div>
              ) : (
                <div>
                  {commentSuccess && (
                    <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-sm text-emerald-700 font-medium">
                      Comment submitted — pending review.
                    </div>
                  )}
                  {!showCommentForm ? (
                    <>
                      <p className="text-sm text-gray-500 mb-3">Share your experience with this model to help others.</p>
                      <button
                        onClick={() => {
                          const supabase = createClient()
                          supabase.auth.getUser().then(({ data: { user } }) => {
                            if (!user) setShowCommentLoginModal(true)
                            else setShowCommentForm(true)
                          })
                        }}
                        className="w-full py-2.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" /> Write a review
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setCommentRating(star)}
                            className={`text-2xl transition-colors ${star <= commentRating ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}>
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
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <p className="text-xs text-gray-400 text-right">{commentText.length} / 1000</p>
                      <div className="flex gap-2">
                        <button
                          onClick={submitComment}
                          disabled={submittingComment || !commentText.trim()}
                          className="flex-1 py-2.5 text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-md transition-all disabled:opacity-50"
                        >
                          {submittingComment ? 'Submitting…' : 'Submit'}
                        </button>
                        <button
                          onClick={() => { setShowCommentForm(false); setCommentText(''); setCommentRating(0) }}
                          className="px-4 py-2.5 text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">All reviews are verified before publishing.</p>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>

            {/* ── About Me ── */}
            {modelDetails?.about_me && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-violet-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-violet-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">About me</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{modelDetails.about_me}</p>
              </div>
            )}

            {/* ── Details ── */}
            {modelDetails && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Details</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    modelDetails.age && ['Age', `${modelDetails.age} yrs`],
                    modelDetails.gender && ['Gender', formatGender(modelDetails.gender)],
                    modelDetails.ethnicity && ['Ethnicity', formatEthnicity(modelDetails.ethnicity)],
                    modelDetails.nationality && ['Nationality', modelDetails.nationality],
                    modelDetails.height_cm && ['Height', `${modelDetails.height_cm} cm`],
                    modelDetails.weight_kg && ['Weight', `${modelDetails.weight_kg} kg`],
                    modelDetails.hair_color && ['Hair', formatHairColor(modelDetails.hair_color)],
                    modelDetails.eye_color && ['Eyes', formatEyeColor(modelDetails.eye_color)],
                    modelDetails.bust_cm && ['Bust', `${modelDetails.bust_cm} cm`],
                    modelDetails.waist_cm && ['Waist', `${modelDetails.waist_cm} cm`],
                    modelDetails.hip_cm && ['Hip', `${modelDetails.hip_cm} cm`],
                    modelDetails.dress_size && ['Dress', modelDetails.dress_size.toUpperCase()],
                    modelDetails.sexual_orientation && ['Orientation', formatEthnicity(modelDetails.sexual_orientation)],
                    modelDetails.smoking && ['Smoking', formatEthnicity(modelDetails.smoking)],
                    modelDetails.drinking && ['Drinking', formatEthnicity(modelDetails.drinking)],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label as string} className="bg-gray-50 rounded-md p-3">
                      <span className="text-xs text-gray-400 font-medium">{label as string}</span>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value as string}</p>
                    </div>
                  ))}
                </div>
                {modelDetails.special_characteristics && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
                    <span className="text-xs font-semibold text-amber-700">Special characteristics</span>
                    <p className="text-sm text-gray-700 mt-0.5">{modelDetails.special_characteristics}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Services ── */}
            {services.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Services</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {services.map((service: any) => (
                    <div key={service.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-xs font-medium text-gray-800 leading-tight">{service.service?.name || 'Service'}</span>
                    </div>
                  ))}
                </div>
                {modelDetails?.services_for?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Services for</p>
                    <div className="flex flex-wrap gap-1.5">
                      {modelDetails.services_for.map((sf: string, i: number) => (
                        <span key={i} className="text-xs px-3 py-1 bg-blue-50 text-blue-700 font-medium rounded-full">{sf}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Languages ── */}
            {languages.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-indigo-100 flex items-center justify-center">
                    <LanguagesIcon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Languages</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang: any) => (
                    <div key={lang.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-md px-3 py-1.5">
                      <span className="text-sm font-semibold text-indigo-800">{lang.language}</span>
                      <span className="text-xs text-indigo-500">{formatLanguageLevel(lang.level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Location & Availability ── */}
            {modelDetails?.city && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-rose-100 flex items-center justify-center">
                    <Home className="w-4 h-4 text-rose-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Location</p>
                </div>
                <div className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                  <MapPin className="w-4 h-4 text-brand" /> {modelDetails.city}
                </div>
                {modelDetails?.incall_options?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {formatIncallOptions(modelDetails.incall_options).map((opt: string, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-pink-50 text-pink-700 font-medium border border-pink-100 rounded-full">Incall: {opt}</span>
                    ))}
                  </div>
                )}
                {modelDetails?.outcall_options?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formatIncallOptions(modelDetails.outcall_options).map((opt: string, i: number) => (
                      <span key={i} className="text-xs px-2.5 py-1 bg-purple-50 text-purple-700 font-medium border border-purple-100 rounded-full">Outcall: {opt}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Rates ── */}
            {rates.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Rates</p>
                </div>
                <div className="space-y-2">
                  {rates.map((rate: any) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rate.rate_type === 'incall' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {rate.rate_type === 'incall' ? 'Incall' : 'Outcall'}
                        </span>
                        <span className="text-sm text-gray-700">{formatDuration(rate.duration)}</span>
                      </div>
                      <span className="text-base font-bold text-brand">{rate.amount} {rate.currency || 'CHF'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Working Hours ── */}
            {workingHours.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-md bg-amber-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Working hours</p>
                </div>
                {(() => {
                  const is24_7 = workingHours.length === 7 && workingHours.every((wh: any) =>
                    wh.start_time === '00:00:00' && wh.end_time === '23:59:00'
                  )
                  if (is24_7) return (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-md">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span className="text-sm font-bold text-emerald-700">Available 24 / 7</span>
                    </div>
                  )
                  return (
                    <div className="space-y-1.5">
                      {workingHours.map((wh: any) => (
                        <div key={wh.id} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-sm text-gray-600">{formatDayOfWeek(wh.day_of_week)}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {wh.start_time && wh.end_time ? `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}` : 'Closed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

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
    </div>
  )
}
