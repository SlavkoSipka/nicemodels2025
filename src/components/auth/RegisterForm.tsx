'use client'

import { useState } from 'react'
import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import DobInput from '@/components/forms/DobInput'

function getAge(dateString: string): number {
  const today = new Date()
  const birth = new Date(dateString)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth.register')
  const [formData, setFormData] = useState({
    userType: '',
    username: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (!formData.userType) {
      setError(t('errorSelectType'))
      setLoading(false)
      return
    }

    if (!formData.phone.trim()) {
      setError(t('errorPhoneRequired'))
      setLoading(false)
      return
    }

    if (!formData.dateOfBirth) {
      setError(t('errorDobRequired'))
      setLoading(false)
      return
    }

    if (getAge(formData.dateOfBirth) < 18) {
      setError(t('errorAge18'))
      setLoading(false)
      return
    }

    if (!termsAccepted || !privacyAccepted) {
      setError(t('errorAcceptTerms'))
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('errorPasswordsMatch'))
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError(t('errorPasswordLength'))
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: formData.username,
            role: formData.userType === 'model' ? 'model' : formData.userType === 'company' ? 'company' : 'user',
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth,
          },
        },
      })

      if (authError) {
        if (!authError.message.includes('Refresh Token Not Found')) {
          const msg = /already|exists|registered/i.test(authError.message)
            ? t('errorAlreadyRegistered')
            : authError.message
          setError(msg)
          setLoading(false)
          return
        }
      }

      // Supabase returns success with empty identities[] when email is already taken
      // (with email confirmation enabled). Surface a clear error in that case.
      if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        setError(t('errorAlreadyRegistered'))
        setLoading(false)
        return
      }

      setSuccess(true)
      setRegisteredEmail(formData.email)
      setResendCooldown(60)
    } catch (err: any) {
      if (!err.message?.includes('Refresh Token Not Found')) {
        setError(err.message || t('errorRegistrationFailed'))
      } else {
        setSuccess(true)
        setRegisteredEmail(formData.email)
        setResendCooldown(60)
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return
    
    setLoading(true)
    setError('')
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      })
      
      if (error) throw error
      
      setResendCooldown(60)
      alert(t('resendSuccess'))
    } catch (err: any) {
      setError(err.message || t('errorResendFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50'

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('successTitle')}</h2>
        <p className="text-sm text-gray-600 mb-2">{t('successWeSent')}</p>
        <p className="text-sm font-semibold text-pink-600 mb-4">{registeredEmail}</p>
        <p className="text-xs text-gray-500 mb-6">{t('successInstruction')}</p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg mb-4 text-left">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <p className="text-xs text-gray-500">{t('successDidntReceive')}</p>
          <button
            onClick={handleResendEmail}
            disabled={resendCooldown > 0 || loading}
            className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? t('resendSending')
              : resendCooldown > 0
                ? t('resendCooldown', { seconds: resendCooldown })
                : t('resendButton')}
          </button>
        </div>

        <Link
          href={searchParams.get('redirect') ? `/login?redirect=${searchParams.get('redirect')}` : '/login'}
          className="inline-block px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all"
        >
          {t('goToLogin')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-2 rounded-r-lg">
          <p className="text-xs text-red-700 font-medium">{error}</p>
        </div>
      )}

      <div className="text-center mb-3">
        <h2 className="text-lg font-bold text-gray-900">{t('title')}</h2>
      </div>

      {/* User Type */}
      <div>
        <label htmlFor="userType" className="block text-xs font-bold text-gray-700 mb-1">
          {t('userTypeLabel')}<span className="text-pink-600">*</span>
        </label>
        <select
          id="userType"
          value={formData.userType}
          onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
          required
          className={inputCls + ' text-gray-700'}
        >
          <option value="">{t('userTypePlaceholder')}</option>
          <option value="user">{t('userTypeMember')}</option>
          <option value="model">{t('userTypeModel')}</option>
          <option value="company">{t('userTypeCompany')}</option>
        </select>
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-xs font-bold text-gray-700 mb-1">
          {t('usernameLabel')}<span className="text-pink-600">*</span>
        </label>
        <input
          id="username"
          type="text"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          placeholder={t('usernamePlaceholder')}
          className={inputCls}
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1">
          {t('emailLabel')}<span className="text-pink-600">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder={t('emailPlaceholder')}
          className={inputCls}
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-xs font-bold text-gray-700 mb-1">
          {t('phoneLabel')}<span className="text-pink-600">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          placeholder={t('phonePlaceholder')}
          className={inputCls}
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label htmlFor="dateOfBirth" className="block text-xs font-bold text-gray-700 mb-1">
          {t('dobLabel')}<span className="text-pink-600">*</span>
          <span className="font-normal text-gray-400 ml-1">{t('dobHint')}</span>
        </label>
        <DobInput
          id="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={(iso) => setFormData({ ...formData, dateOfBirth: iso })}
          required
          minYearsAgo={18}
          className={inputCls}
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1">
          {t('passwordLabel')}<span className="text-pink-600">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            placeholder={t('passwordPlaceholder')}
            className={inputCls + ' pr-10'}
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

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-700 mb-1">
          {t('confirmPasswordLabel')}<span className="text-pink-600">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            placeholder={t('passwordPlaceholder')}
            className={inputCls + ' pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2 pt-2">
        <label className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-pink-600 border-2 border-gray-300 rounded focus:ring-1 focus:ring-pink-200 cursor-pointer"
          />
          <span className="text-xs text-gray-700 leading-tight">
            {t('acceptTerms')}{' '}
            <a href="/terms" className="text-pink-600 hover:text-pink-700 font-semibold underline">
              {t('termsLink')}
            </a>
          </span>
        </label>

        <label className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-pink-600 border-2 border-gray-300 rounded focus:ring-1 focus:ring-pink-200 cursor-pointer"
          />
          <span className="text-xs text-gray-700 leading-tight">
            {t('acceptPrivacy')}{' '}
            <a href="/privacy" className="text-pink-600 hover:text-pink-700 font-semibold underline">
              {t('privacyLink')}
            </a>
          </span>
        </label>

        <label className="flex items-start gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-pink-600 border-2 border-gray-300 rounded focus:ring-1 focus:ring-pink-200 cursor-pointer"
          />
          <span className="text-xs text-gray-700 leading-tight">
            {t('newsletter')}
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
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t('submitting')}
          </span>
        ) : (
          t('submit')
        )}
      </button>
    </form>
  )
}
