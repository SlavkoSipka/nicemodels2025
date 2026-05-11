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

    // For signup we sign the user out immediately so they explicitly log in once
    // (preserves the prior behavior). For recovery / email_change we keep the
    // session so the user can update password / continue.
    if (type === 'signup' || type === 'email') {
      await supabase.auth.signOut()
      const target = type === 'signup' ? '/login?verified=true' : '/login?email_changed=true'
      return NextResponse.redirect(`${origin}${target}`)
    }

    // recovery, magiclink, email_change — keep session and continue.
    const safeNext = next.startsWith('/') ? next : '/login'
    return NextResponse.redirect(`${origin}${safeNext}`)
  } catch (err) {
    console.error('Confirm error:', err)
    return NextResponse.redirect(`${origin}/login?error=callback_error`)
  }
}
