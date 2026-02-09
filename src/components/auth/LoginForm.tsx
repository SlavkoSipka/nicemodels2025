'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verifiedMessage, setVerifiedMessage] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setVerifiedMessage(true)
      setTimeout(() => setVerifiedMessage(false), 5000)
    }
    
    // Check if email is saved (Remember me)
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [searchParams])

  const loginWithCredentials = async (loginEmail: string, loginPassword: string) => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) {
        // Ignore "Refresh Token Not Found" error (harmless Next.js 15 warning)
        if (!error.message.includes('Refresh Token Not Found')) {
          throw error
        }
      }

      // Check if user needs onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, role')
        .eq('id', data.user?.id)
        .single()

      if (!profile) {
        setError('Profile not found for this account.')
        return
      }

      // Some older accounts might have role = 'user' even if they completed model onboarding.
      // As a safety net, detect if this user has model_details and treat them as a model.
      let effectiveRole = profile.role

      if (profile.role === 'user') {
        try {
          const { data: modelDetails } = await supabase
            .from('model_details')
            .select('model_id')
            .eq('model_id', data.user?.id)
            .maybeSingle()

          if (modelDetails) {
            effectiveRole = 'model'

            // Try to fix the role in profiles so future logins go directly to model dashboard
            await supabase
              .from('profiles')
              .update({ role: 'model' })
              .eq('id', data.user?.id)
          }
        } catch (checkError) {
          // Non‑fatal: just log, don't block login
          console.error('Error checking model_details for role fix:', checkError)
        }
      }

      // Check if admin
      if (effectiveRole === 'admin') {
        router.push('/dashboard/admin')
      } else if (!profile?.onboarding_completed) {
        // Redirect to onboarding
        router.push('/onboarding')
      } else {
        // Redirect to dashboard based on role
        if (effectiveRole === 'model') {
          router.push('/dashboard/model')
        } else if (effectiveRole === 'company') {
          router.push('/dashboard/company')
        } else {
          router.push('/dashboard')
        }
      }
      router.refresh()
    } catch (err: any) {
      // Ignore "Refresh Token Not Found" error
      if (!err.message?.includes('Refresh Token Not Found')) {
        setError(err.message || 'Failed to login. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!termsAccepted || !privacyAccepted) {
      setError('You must accept the terms and conditions and privacy policy.')
      return
    }
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }

    await loginWithCredentials(email, password)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {verifiedMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2 rounded-r-lg">
          <p className="text-xs text-green-700 font-medium">✓ Email verified successfully! You can now login.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded-r-lg">
          <p className="text-xs text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="text-center mb-3">
        <h2 className="text-lg font-bold text-gray-900">Sign in to your account</h2>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1">
          Email<span className="text-pink-600">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="name@domain.com"
          className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1">
          Password<span className="text-pink-600">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••••"
            className="w-full px-3 py-2 pr-10 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Forgot Password */}
      <div className="text-right">
        <Link href="/forgot-password" className="text-xs text-pink-600 hover:text-pink-700 font-semibold">
          Forgot password?
        </Link>
      </div>

      {/* Remember Me */}
      <div className="pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-pink-600 border-2 border-gray-300 rounded focus:ring-1 focus:ring-pink-200 cursor-pointer"
          />
          <span className="text-xs text-gray-700">Remember me</span>
        </label>
      </div>

      {/* Terms & Privacy */}
      <div className="space-y-2 pt-2">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-pink-600 border-2 border-gray-300 rounded focus:ring-1 focus:ring-pink-200 cursor-pointer"
          />
          <span className="text-xs text-gray-700 leading-tight">
            I accept the <Link href="/terms" className="text-pink-600 hover:text-pink-700 font-semibold underline">terms and conditions</Link>
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-pink-600 border-2 border-gray-300 rounded focus:ring-1 focus:ring-pink-200 cursor-pointer"
          />
          <span className="text-xs text-gray-700 leading-tight">
            I accept the <Link href="/privacy" className="text-pink-600 hover:text-pink-700 font-semibold underline">privacy policy</Link>
          </span>
        </label>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-lg transition-all shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Signing in...
          </span>
        ) : (
          'LOG IN'
        )}
      </button>
    </form>
  )
}
