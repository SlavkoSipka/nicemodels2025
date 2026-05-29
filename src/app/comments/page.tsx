import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import CommentsPageClient from './CommentsPageClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Bewertungen & Kommentare',
  description:
    'Lese echte Bewertungen und Kommentare zu Escort-Models auf NiceModels.ch.',
  alternates: { canonical: 'https://www.nicemodels.ch/comments' },
}

export default async function CommentsPage() {
  const supabase = await createClient()

  // Fetch all approved comments with model details and photos
  const { data: comments } = await supabase
    .from('model_comments')
    .select(`
      id,
      comment_text,
      rating,
      created_at,
      reply_text,
      replied_at,
      user:profiles!model_comments_user_id_fkey (
        id,
        username,
        avatar_url,
        is_blocked
      ),
      model:profiles!model_comments_model_id_fkey (
        id,
        username,
        public_id,
        is_blocked,
        model_details!model_details_model_id_fkey (
          showname,
          city
        )
      )
    `)
    .in('status', ['approved', 'reviewed'])
    .order('created_at', { ascending: false })

  // Hide comments where commenter or target model is blocked
  const visibleComments = (comments || []).filter(c => {
    const m = Array.isArray(c.model) ? c.model[0] : (c.model as any)
    const u = Array.isArray(c.user) ? c.user[0] : (c.user as any)
    return !m?.is_blocked && !u?.is_blocked
  })

  // Fetch model photos separately for approved comments
  const modelIds = visibleComments.map(c => (Array.isArray(c.model) ? c.model[0] : (c.model as any))?.id).filter(Boolean)
  const { data: photos } = await supabase
    .from('model_photos')
    .select('model_id, file_path')
    .in('model_id', modelIds)
    .eq('is_approved', true)
    .order('model_id')
    .order('display_order', { ascending: true })
    .order('uploaded_at', { ascending: false })

  // Create a map of model_id -> first photo
  const photoMap: Record<string, string> = {}
  photos?.forEach(photo => {
    if (!photoMap[photo.model_id]) {
      photoMap[photo.model_id] = photo.file_path
    }
  })

  // Attach photos to comments and transform structure
  const commentsWithPhotos = visibleComments.map(comment => {
    const model = Array.isArray(comment.model) ? comment.model[0] : comment.model
    const user = Array.isArray(comment.user) ? comment.user[0] : comment.user
    return {
      ...comment,
      user: user || { id: '', username: 'Unknown', avatar_url: null },
      model: model || { id: '', username: '', model_details: [] },
      modelPhoto: photoMap[model?.id] || null
    }
  }) || []

  return (
    <>
      <Navbar />
      <CommentsPageClient comments={commentsWithPhotos} />
    </>
  )
}
