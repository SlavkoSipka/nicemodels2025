import { createClient } from '@/lib/supabase/client'

export type TrackingAction = 'profile_view' | 'contact_view' | 'favorite_add' | 'share'

/**
 * Track user action on model profile
 */
export async function trackModelAction(
  modelId: string,
  actionType: TrackingAction
): Promise<void> {
  try {
    const supabase = createClient()
    
    // Get current user (if logged in)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Track action
    await supabase.from('model_statistics').insert({
      model_id: modelId,
      user_id: user?.id || null,
      action_type: actionType,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    })
    
    // Silent fail - ne prikazujemo greške korisniku
  } catch (error) {
    console.error('Tracking error:', error)
  }
}

/**
 * Track profile view with debouncing to prevent multiple rapid fires
 */
let profileViewTimeout: NodeJS.Timeout | null = null

export function trackProfileView(modelId: string): void {
  if (profileViewTimeout) {
    clearTimeout(profileViewTimeout)
  }
  
  profileViewTimeout = setTimeout(() => {
    trackModelAction(modelId, 'profile_view')
  }, 1000) // Track after 1 second to ensure it's not just a quick scroll
}
