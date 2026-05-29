import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UserCommentsClient from './UserCommentsClient'

export default async function UserCommentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's comments
  const { data: comments } = await supabase
    .from('model_comments')
    .select(`
      id,
      comment_text,
      rating,
      status,
      created_at,
      model:profiles!model_comments_model_id_fkey (
        id,
        username,
        model_details!model_details_model_id_fkey (
          showname,
          city
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Transform nested arrays to objects
  const transformedComments = comments?.map(comment => ({
    ...comment,
    model: Array.isArray(comment.model) ? comment.model[0] : comment.model
  })) || []

  return <UserCommentsClient comments={transformedComments} />
}
