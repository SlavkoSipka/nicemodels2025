import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code:', error)
        return NextResponse.redirect(`${origin}/login?error=verification_failed`)
      }
      
      // Email verified successfully, but sign out immediately
      // User needs to login manually after email verification
      await supabase.auth.signOut()
      
      // Redirect to login with verified flag
      return NextResponse.redirect(`${origin}/login?verified=true`)
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(`${origin}/login?error=callback_error`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login`)
}
