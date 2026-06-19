'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import DobInput from '@/components/forms/DobInput'
import PhoneInput from '@/components/ui/PhoneInput'
import { joinPhone, DEFAULT_DIAL_CODE } from '@/lib/countries'

function safePostAuthRedirect(raw: string | null): string {
  const fallback = '/dashboard'
  if (!raw) return fallback
  const pathname = raw.trim().split('#')[0].split('?')[0]
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return fallback
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/onboarding') {
    return pathname
  }
  return fallback
}

function getAge(dateString: string): number {
  const today = new Date()
  const birth = new Date(dateString)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function RegisterForm() {
  const searchParams = useSearchParams()
  const t = useTranslations('auth.register')
  const [formData, setFormData] = useState({
    userType: '',
    username: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
  })
  const [phoneCountry, setPhoneCountry] = useState<string>(DEFAULT_DIAL_CODE)
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.userType) {
      setError(t('errorSelectType'))
      setLoading(false)
      return
    }

    const fullPhone = joinPhone(phoneCountry, phoneNumber)
    if (!phoneNumber.trim()) {
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
          data: {
            username: formData.username,
            role: formData.userType === 'model' ? 'model' : formData.userType === 'company' ? 'company' : 'user',
            phone: fullPhone,
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

      if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        setError(t('errorAlreadyRegistered'))
        setLoading(false)
        return
      }

      if (authData?.session) {
        // Notify the team of the new registration (best-effort, non-blocking).
        await fetch('/api/email/new-registration', { method: 'POST', keepalive: true }).catch(() => {})
        window.location.href = safePostAuthRedirect(searchParams.get('redirect'))
        return
      }

      setError(t('errorNoSession'))
      setLoading(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('Refresh Token Not Found')) {
        // Supabase client quirk after signUp — session cookies may still be set.
        await fetch('/api/email/new-registration', { method: 'POST', keepalive: true }).catch(() => {})
        window.location.href = safePostAuthRedirect(searchParams.get('redirect'))
        return
      }
      setError(message || t('errorRegistrationFailed'))
      setLoading(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-all bg-gray-50'

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
        <PhoneInput
          id="phone"
          countryCode={phoneCountry}
          phoneNumber={phoneNumber}
          onCountryCodeChange={setPhoneCountry}
          onPhoneNumberChange={setPhoneNumber}
          placeholder={t('phonePlaceholder')}
          required
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
