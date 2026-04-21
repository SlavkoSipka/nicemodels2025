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

// ==========================================================================
// Generic event tracking (listings, banners, site pages)
// All events flow through /api/track/event which uses the service role to
// insert into the analytics tables. Failures are always silent.
// ==========================================================================

async function postEvent(event_type: string, payload: Record<string, any>): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const body = JSON.stringify({ event_type, payload })
    // Prefer sendBeacon for fire-and-forget reliability on navigations.
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        '/api/track/event',
        new Blob([body], { type: 'application/json' })
      )
      if (ok) return
    }
    await fetch('/api/track/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    })
  } catch {
    // silent
  }
}

export type ListingClickType =
  | 'phone'
  | 'sms'
  | 'email'
  | 'website'
  | 'whatsapp'
  | 'viber'
  | 'telegram'

export function trackListingView(listingId: string): void {
  if (!listingId) return
  postEvent('listing_view', { listing_id: listingId })
}

export function trackListingClick(listingId: string, clickType: ListingClickType): void {
  if (!listingId) return
  postEvent('listing_click', { listing_id: listingId, click_type: clickType })
}

export function trackBannerImpression(bannerId: string, pagePath?: string): void {
  if (!bannerId) return
  postEvent('banner_impression', {
    banner_id: bannerId,
    page_path: pagePath ?? (typeof window !== 'undefined' ? window.location.pathname : null),
  })
}

export function trackBannerClick(bannerId: string, clickType?: string): void {
  if (!bannerId) return
  postEvent('banner_click', {
    banner_id: bannerId,
    click_type: clickType,
    page_path: typeof window !== 'undefined' ? window.location.pathname : null,
  })
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let sid = sessionStorage.getItem('nm_sid')
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem('nm_sid', sid)
    }
    return sid
  } catch {
    return ''
  }
}

export function trackPageView(path: string): void {
  if (!path) return
  postEvent('page_view', {
    path,
    session_id: getSessionId(),
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
  })
}
