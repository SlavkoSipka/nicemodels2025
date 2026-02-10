'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
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
      }
    }

    setIsSavingFavorite(false)
  }

  const handleShare = async () => {
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

  // Get photo URLs
  const photoUrls = photos
    .map((photo: any) => {
      if (!photo.file_path) return null
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/model-photos/${photo.file_path}`
    })
    .filter((url): url is string => url !== null)

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
    <div className="min-h-screen bg-gray-50">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to all models</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[550px_1fr] gap-8">
          {/* Left Column - Photos Only */}
          <div className="space-y-6">
            {/* Photo Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-4">
              {/* Main Photo */}
              <div className="relative aspect-[9/16] bg-gradient-to-br from-pink-100 to-rose-100">
                {photoUrls.length > 0 && photoUrls[selectedPhotoIndex] ? (
                  <>
                    <Image
                      src={photoUrls[selectedPhotoIndex]}
                      alt={modelDetails?.showname || profile.username}
                      fill
                      sizes="(max-width: 768px) 100vw, 550px"
                      className="object-cover"
                      priority
                    />
                    {/* Navigation Arrows */}
                    {photoUrls.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedPhotoIndex(prev => prev === 0 ? photoUrls.length - 1 : prev - 1)}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => setSelectedPhotoIndex(prev => prev === photoUrls.length - 1 ? 0 : prev + 1)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                    {/* Photo Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {selectedPhotoIndex + 1} / {photoUrls.length}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-20 h-20 text-pink-300" />
                  </div>
                )}

                {/* Verified Badge */}
                {profile.is_verified && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {photoUrls.length > 1 && (
                <div className="p-4 bg-gray-50 flex gap-2 overflow-x-auto justify-center">
                  {photoUrls.map((url: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPhotoIndex(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        index === selectedPhotoIndex
                          ? 'border-pink-500 ring-2 ring-pink-200'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      {url && (
                        <Image
                          src={url}
                          alt={`Photo ${index + 1}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column - All Content */}
          <div className="space-y-6">
            {/* Main Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {modelDetails?.showname || profile.username}
              </h1>

              {/* Slogan */}
              {modelDetails?.slogan && (
                <p className="text-sm text-gray-600 italic mb-4">
                  "{modelDetails.slogan}"
                </p>
              )}

              {/* Location */}
              {modelDetails?.city && (
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 text-pink-600" />
                  <span className="font-medium">{modelDetails.city}</span>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {modelDetails?.age && (
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-pink-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Age</div>
                    <div className="text-lg font-bold text-gray-900">{modelDetails.age}</div>
                  </div>
                )}
                {photos.length > 0 && (
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <div className="text-sm text-gray-600">Photos</div>
                    <div className="text-lg font-bold text-gray-900">{photos.length}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {!showContact ? (
                  <button 
                    onClick={() => setShowContact(true)}
                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    Show Contact
                  </button>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                    {contactDetails ? (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <Phone className="w-5 h-5 text-green-600" />
                          <span className="font-bold text-gray-900">Contact Information</span>
                        </div>
                        
                        {/* Phone Number */}
                        {contactDetails.show_phone_number && contactDetails.phone_number && (
                          <>
                            <a 
                              href={`tel:${contactDetails.country_code || ''}${contactDetails.phone_number}`} 
                              className="text-2xl font-bold text-green-600 hover:text-green-700 block mb-3"
                            >
                              {contactDetails.country_code || ''} {contactDetails.phone_number}
                            </a>
                            
                            {/* Messaging Apps */}
                            {(contactDetails.has_whatsapp || contactDetails.has_viber || contactDetails.has_telegram) && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {contactDetails.has_whatsapp && (
                                  <span className="px-3 py-1 bg-white text-green-600 rounded-full text-xs font-semibold border border-green-200">
                                    WhatsApp
                                  </span>
                                )}
                                {contactDetails.has_viber && (
                                  <span className="px-3 py-1 bg-white text-purple-600 rounded-full text-xs font-semibold border border-purple-200">
                                    Viber
                                  </span>
                                )}
                                {contactDetails.has_telegram && (
                                  <span className="px-3 py-1 bg-white text-blue-600 rounded-full text-xs font-semibold border border-blue-200">
                                    Telegram
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Email */}
                        {contactDetails.email && (
                          <a 
                            href={`mailto:${contactDetails.email}`}
                            className="flex items-center gap-2 text-gray-700 hover:text-green-600 mb-2"
                          >
                            <Mail className="w-4 h-4" />
                            <span className="font-medium">{contactDetails.email}</span>
                          </a>
                        )}
                        
                        {/* Website */}
                        {contactDetails.website && (
                          <a 
                            href={contactDetails.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-700 hover:text-green-600 mb-3"
                          >
                            <Globe className="w-4 h-4" />
                            <span className="font-medium">{contactDetails.website}</span>
                          </a>
                        )}
                        
                        {/* Instructions */}
                        {contactDetails.contact_instruction && (
                          <p className="text-sm text-gray-700 mb-2 bg-white p-2 rounded">
                            📋 {contactDetails.contact_instruction.replace(/_/g, ' ')}
                          </p>
                        )}
                        
                        {contactDetails.no_withheld_numbers && (
                          <p className="text-xs text-red-600 font-medium mb-2 bg-red-50 p-2 rounded">
                            ⚠️ No withheld numbers accepted
                          </p>
                        )}
                        
                        {contactDetails.other_instructions && (
                          <p className="text-sm text-gray-600 italic bg-white p-2 rounded">
                            💬 {contactDetails.other_instructions}
                          </p>
                        )}
                        
                        {/* If no contact info at all */}
                        {!contactDetails.phone_number && !contactDetails.email && !contactDetails.website && (
                          <div className="text-center py-2">
                            <p className="text-gray-600 text-sm">No contact details provided yet</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Phone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">Contact information not available</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={toggleFavorite}
                    disabled={isSavingFavorite || isCheckingFavorite}
                    className={`py-2 border-2 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                      isFavorite 
                        ? 'bg-pink-600 border-pink-600 text-white hover:bg-pink-700' 
                        : 'border-pink-600 text-pink-600 hover:bg-pink-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Heart 
                      className={`w-4 h-4 transition-all duration-300 ${
                        isFavorite 
                          ? 'fill-current scale-110 animate-pulse' 
                          : 'scale-100'
                      }`} 
                    />
                    <span className={isSavingFavorite ? 'animate-pulse' : ''}>
                      {isSavingFavorite ? 'Saving...' : isFavorite ? 'Saved' : 'Save'}
                    </span>
                    {isFavorite && (
                      <span className="absolute inset-0 bg-pink-400 opacity-0 animate-ping"></span>
                    )}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="py-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* User Reviews Section - Only visible to logged-in users, excluding user's own comment */}
            {(() => {
              const otherUsersComments = comments?.filter((c: any) => c.user?.id !== currentUserId) || []
              return isLoggedIn && otherUsersComments.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                    User Reviews ({otherUsersComments.length})
                  </h2>
                  <div className="space-y-4">
                    {otherUsersComments.map((comment: any) => (
                      <div key={comment.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{comment.user.username || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          {comment.rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: comment.rating }).map((_: any, i: number) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 leading-relaxed">{comment.comment_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* My Comment or Leave a Comment Section */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-300 p-6">
              {myComment ? (
                // User has already submitted a comment - show it
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Your Comment</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      myComment.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      myComment.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {myComment.status === 'pending' ? '⏳ Pending Review' :
                       myComment.status === 'approved' ? '✓ Approved' :
                       '✗ Not Approved'}
                    </span>
                  </div>
                  
                  {myComment.rating && (
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: myComment.rating }).map((_: any, i: number) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  )}
                  
                  <div className="bg-white rounded-lg p-4 mb-3">
                    <p className="text-gray-800 leading-relaxed">{myComment.comment_text}</p>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Submitted on {new Date(myComment.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  
                  {myComment.status === 'pending' && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-700">
                        <strong>Under Review:</strong> Your comment is being reviewed by our administrators.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // User hasn't submitted a comment yet - show form
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Share Your Experience</h3>
                  </div>
                  
                  {commentSuccess && (
                    <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <p className="text-green-800 font-semibold mb-1">✅ Comment Submitted!</p>
                      <p className="text-sm text-green-700">
                        Thank you for your feedback. Your comment is pending admin review and will be published once approved.
                      </p>
                    </div>
                  )}

                  {!showCommentForm ? (
                    <div>
                      <p className="text-sm text-gray-700 mb-4">
                        Have you worked with this model? Share your honest experience to help others make informed decisions. 
                        Your review will be verified before publishing.
                      </p>
                      <button
                        onClick={() => {
                          const supabase = createClient()
                          supabase.auth.getUser().then(({ data: { user } }) => {
                            if (!user) {
                              setShowCommentLoginModal(true)
                            } else {
                              setShowCommentForm(true)
                            }
                          })
                        }}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" />
                        Leave a Comment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Rating */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Rating (Optional)
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setCommentRating(star)}
                              className={`text-3xl transition-all ${
                                star <= commentRating ? 'text-yellow-400' : 'text-gray-300'
                              } hover:text-yellow-400`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment Text */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Your Experience *
                        </label>
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Share your honest experience working with this model..."
                          rows={5}
                          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          maxLength={1000}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {commentText.length} / 1000 characters
                        </p>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={submitComment}
                          disabled={submittingComment || !commentText.trim()}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submittingComment ? 'Submitting...' : 'Submit Comment'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCommentForm(false)
                            setCommentText('')
                            setCommentRating(0)
                          }}
                          className="px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>

                      <p className="text-xs text-gray-600 italic">
                        📝 All comments are reviewed by our team before being published to ensure authenticity and quality.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bio Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-pink-600" />
                Bio & Personal Info
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {modelDetails?.age && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Age</span>
                    <span className="text-gray-900 font-semibold">{modelDetails.age} years</span>
                  </div>
                )}
                {modelDetails?.gender && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Gender</span>
                    <span className="text-gray-900 font-semibold">{formatGender(modelDetails.gender)}</span>
                  </div>
                )}
                {modelDetails?.ethnicity && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Ethnicity</span>
                    <span className="text-gray-900 font-semibold">{formatEthnicity(modelDetails.ethnicity)}</span>
                  </div>
                )}
                {modelDetails?.nationality && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Nationality</span>
                    <span className="text-gray-900 font-semibold">{modelDetails.nationality}</span>
                  </div>
                )}
                {modelDetails?.height_cm && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Height</span>
                    <span className="text-gray-900 font-semibold">{modelDetails.height_cm} cm</span>
                  </div>
                )}
                {modelDetails?.weight_kg && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Weight</span>
                    <span className="text-gray-900 font-semibold">{modelDetails.weight_kg} kg</span>
                  </div>
                )}
                {modelDetails?.hair_color && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Hair Color</span>
                    <span className="text-gray-900 font-semibold">{formatHairColor(modelDetails.hair_color)}</span>
                  </div>
                )}
                {modelDetails?.eye_color && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Eye Color</span>
                    <span className="text-gray-900 font-semibold">{formatEyeColor(modelDetails.eye_color)}</span>
                  </div>
                )}
                {modelDetails?.bust_cm && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Bust</span>
                    <span className="text-gray-900 font-semibold">{modelDetails.bust_cm} cm</span>
                  </div>
                )}
                {modelDetails?.waist_cm && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Waist</span>
                    <span className="text-gray-900 font-semibold">{modelDetails.waist_cm} cm</span>
                  </div>
                )}
                {modelDetails?.hip_cm && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Hip</span>
                    <span className="text-gray-900 font-semibold">{modelDetails.hip_cm} cm</span>
                  </div>
                )}
                {modelDetails?.dress_size && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Dress Size</span>
                    <span className="text-gray-900 font-semibold">{modelDetails.dress_size.toUpperCase()}</span>
                  </div>
                )}
                {modelDetails?.sexual_orientation && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Orientation</span>
                    <span className="text-gray-900 font-semibold">{formatEthnicity(modelDetails.sexual_orientation)}</span>
                  </div>
                )}
                {modelDetails?.pubic_hair && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Pubic Hair</span>
                    <span className="text-gray-900 font-semibold">{formatEthnicity(modelDetails.pubic_hair)}</span>
                  </div>
                )}
                {modelDetails?.smoking && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Smoking</span>
                    <span className="text-gray-900 font-semibold">{formatEthnicity(modelDetails.smoking)}</span>
                  </div>
                )}
                {modelDetails?.drinking && (
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 mb-1">Drinking</span>
                    <span className="text-gray-900 font-semibold">{formatEthnicity(modelDetails.drinking)}</span>
                  </div>
                )}
              </div>
              {modelDetails?.special_characteristics && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Special Characteristics</h3>
                  <p className="text-gray-600">{modelDetails.special_characteristics}</p>
                </div>
              )}
            </div>

            {/* About Me Section */}
            {modelDetails?.about_me && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-pink-600" />
                  About Me
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {modelDetails.about_me}
                </p>
              </div>
            )}

            {/* Languages */}
            {languages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <LanguagesIcon className="w-6 h-6 text-pink-600" />
                  Languages
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((lang: any) => (
                    <div key={lang.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <span className="font-semibold text-gray-900">{lang.language}</span>
                      <span className="text-sm text-gray-600">{formatLanguageLevel(lang.level)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Area & Address */}
            {modelDetails?.city && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Home className="w-6 h-6 text-pink-600" />
                  Location & Availability
                </h2>
                <div className="space-y-3">
                  {modelDetails?.city && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-pink-600 mt-1" />
                      <div>
                        <div className="font-semibold text-gray-900">{modelDetails.city}</div>
                        {modelDetails?.incall_options && modelDetails.incall_options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {formatIncallOptions(modelDetails.incall_options).map((option: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium">
                                Incall: {option}
                              </span>
                            ))}
                          </div>
                        )}
                        {modelDetails?.outcall_options && modelDetails.outcall_options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {formatIncallOptions(modelDetails.outcall_options).map((option: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                Outcall: {option}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {modelDetails?.services_for && modelDetails.services_for.length > 0 && (
                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Services For</h3>
                      <div className="flex flex-wrap gap-2">
                        {modelDetails.services_for.map((service: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-white text-gray-700 rounded text-sm">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services Section */}
            {services.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                  Services Offered
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {services.map((service: any) => (
                    <div
                      key={service.id}
                      className="flex items-center gap-1.5 p-2 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-800 leading-tight">
                        {service.service?.name || 'Service'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Working Hours Section */}
            {workingHours.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-pink-600" />
                  Working Hours
                </h2>
                {(() => {
                  // Check if all days are 24/7 (00:00 - 23:59)
                  const is24_7 = workingHours.length === 7 && workingHours.every((wh: any) => 
                    wh.start_time === '00:00:00' && wh.end_time === '23:59:00'
                  )
                  
                  if (is24_7) {
                    return (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xl font-bold text-green-700">24/7 Available</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <p className="text-xs text-green-600 font-medium">Open every day, all day</p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-2">
                      {workingHours.map((wh: any) => (
                        <div key={wh.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-900">{formatDayOfWeek(wh.day_of_week)}</span>
                          <span className="text-gray-600">
                            {wh.start_time && wh.end_time 
                              ? `${wh.start_time.slice(0, 5)} - ${wh.end_time.slice(0, 5)}`
                              : 'Closed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Rates Section */}
            {rates.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-pink-600" />
                  Rates
                </h2>
                <div className="space-y-3">
                  {rates.map((rate: any) => (
                    <div
                      key={rate.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          rate.rate_type === 'incall' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {rate.rate_type === 'incall' ? 'Incall' : 'Outcall'}
                        </div>
                        <span className="text-gray-700 font-medium">
                          {formatDuration(rate.duration)}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-pink-600">
                        {rate.amount} {rate.currency || 'CHF'}
                      </div>
                    </div>
                  ))}
                </div>
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
                href="/register"
                className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all shadow-lg text-center"
              >
                Create Account
              </Link>
              <Link
                href="/login"
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
                href="/register"
                className="block w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold rounded-lg transition-all shadow-lg text-center"
              >
                Create Account
              </Link>
              <Link
                href="/login"
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
