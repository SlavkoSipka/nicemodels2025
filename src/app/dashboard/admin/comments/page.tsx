import { createClient } from '@/lib/supabase/server'
import CommentsReviewClient from './CommentsReviewClient'

export default async function AdminCommentsPage() {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from('model_comments')
    .select(`
      id,
      comment_text,
      rating,
      status,
      created_at,
      user:profiles!model_comments_user_id_fkey (
        id,
        username,
        email,
        phone,
        city,
        description
      ),
      model:profiles!model_comments_model_id_fkey (
        id,
        username,
        email,
        model_details!model_details_model_id_fkey (
          showname,
          city
        ),
        model_contact_details!model_contact_details_model_id_fkey (
          phone_number,
          country_code,
          has_whatsapp,
          has_viber,
          has_telegram
        )
      )
    `)
    .order('created_at', { ascending: false })

  const transformedComments = comments?.map(comment => {
    const model = Array.isArray(comment.model) ? comment.model[0] : comment.model
    const modelDetails = Array.isArray(model?.model_details)
      ? model.model_details
      : (model?.model_details ? [model.model_details] : [])
    const modelContactDetails = Array.isArray(model?.model_contact_details)
      ? model.model_contact_details
      : (model?.model_contact_details ? [model.model_contact_details] : [])

    return {
      ...comment,
      user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
      model: {
        ...model,
        model_details: modelDetails,
        model_contact_details: modelContactDetails
      }
    }
  }) || []

  return <CommentsReviewClient comments={transformedComments} />
}
