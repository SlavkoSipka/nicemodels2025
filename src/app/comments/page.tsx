import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import CommentsPageClient from './CommentsPageClient'

export default async function CommentsPage() {
  const supabase = await createClient()

  // Fetch all approved comments with model details and photos
  const { data: comments, error } = await supabase
    .from('model_comments')
    .select(`
      id,
      comment_text,
      rating,
      created_at,
      user:profiles!model_comments_user_id_fkey (
        id,
        username
      ),
      model:profiles!model_comments_model_id_fkey (
        id,
        username,
        model_details!model_details_model_id_fkey (
          showname,
          city
        )
      )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  // Fetch model photos separately for approved comments
  const modelIds = comments?.map(c => (c.model as any)?.id).filter(Boolean) || []
  const { data: photos } = await supabase
    .from('model_photos')
    .select('model_id, file_path')
    .in('model_id', modelIds)
    .eq('is_approved', true)
    .order('uploaded_at', { ascending: false })

  // Create a map of model_id -> first photo
  const photoMap: Record<string, string> = {}
  photos?.forEach(photo => {
    if (!photoMap[photo.model_id]) {
      photoMap[photo.model_id] = photo.file_path
    }
  })

  // Attach photos to comments and transform structure
  const commentsWithPhotos = comments?.map(comment => {
    const model = Array.isArray(comment.model) ? comment.model[0] : comment.model
    const user = Array.isArray(comment.user) ? comment.user[0] : comment.user
    return {
      ...comment,
      user: user || { id: '', username: 'Unknown' },
      model: model || { id: '', username: '', model_details: [] },
      modelPhoto: photoMap[model?.id] || null
    }
  }) || []

  console.log('Comments page:', { comments: commentsWithPhotos.length, error })

  return (
    <>
      <Navbar />
      <CommentsPageClient comments={commentsWithPhotos} />
    </>
  )
}
