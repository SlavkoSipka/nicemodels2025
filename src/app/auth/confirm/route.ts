import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Token-hash flow for email confirmations (signup, recovery, email change, magic link).
 *
 * Why this instead of /auth/callback (PKCE code flow):
 * - Works cross-device (open the email on any phone / browser).
 * - Not vulnerable to email-client / antivirus link pre-fetch consuming a single-use code.
 *
 * Email templates in Supabase use:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/login?verified=true
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const next = requestUrl.searchParams.get('next') || '/login'

  // Always send users to the canonical site URL.
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin).replace(/\/$/, '')

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${origin}/login?error=verification_failed`)
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (error) {
      console.error('verifyOtp error:', error.message)
      return NextResponse.redirect(`${origin}/login?error=verification_failed`)
    }

    // Keep the session active so the user continues in whichever browser
    // opened the email link (important on mobile where Samsung/in-app
    // browsers can't share session state with Chrome). The server route at
    // /dashboard routes them to onboarding or to their role-specific
    // dashboard, so we don't need to know the role here.
    if (type === 'signup') {
      return NextResponse.redirect(`${origin}/dashboard`)
    }

    const safeNext = next.startsWith('/') ? next : '/login'
    return NextResponse.redirect(`${origin}${safeNext}`)
  } catch (err) {
    console.error('Confirm error:', err)
    return NextResponse.redirect(`${origin}/login?error=callback_error`)
  }
}
