'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import emailjs from '@emailjs/browser'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Phone, Mail, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { contactSubjectLabel } from '@/lib/contact/subjectLabels'
import PhoneInput from '@/components/ui/PhoneInput'
import { joinPhone, DEFAULT_DIAL_CODE } from '@/lib/countries'

const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? ''
const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? ''
const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ?? ''

export default function ContactPage() {
  const t = useTranslations('publicPages.contact')
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  })
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_DIAL_CODE)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!serviceId || !templateId || !publicKey) {
      setError(t('errNotConfigured'))
      return
    }

    setSending(true)
    try {
      const fullPhone = joinPhone(phoneCountry, phoneNumber.trim())
      await emailjs.send(
        serviceId,
        templateId,
        {
          user_email: formData.email.trim(),
          user_phone: fullPhone || '—',
          subject_key: formData.subject,
          subject_label: contactSubjectLabel(formData.subject),
          message: formData.message.trim(),
          submitted_at: new Date().toISOString(),
        },
        { publicKey },
      )

      setSuccess(true)
      setFormData({ email: '', subject: '', message: '' })
      setPhoneCountry(DEFAULT_DIAL_CODE)
      setPhoneNumber('')
      setTimeout(() => setSuccess(false), 8000)
    } catch {
      setError(t('errGeneric'))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#fce9f3', minHeight: '100vh' }}>
        {/* Minimal header */}
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-8">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{t('title')}</h1>
            <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
            <p className="text-sm text-slate-600 mt-3 px-3 py-2 rounded-lg max-w-2xl" style={{ background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.20)' }}>
              <span className="font-medium text-slate-900">{t('betaLabel')}</span> {t('betaText')}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 pt-6 pb-12 sm:px-4 sm:pt-12 sm:pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
            
            {/* Contact Information - Left Side */}
            <div className="lg:col-span-1 space-y-3 sm:space-y-4">
              {/* Contact */}
              <div className="rounded-xl p-4 sm:p-5" style={{ background: '#ffffff', border: '1px solid rgba(59,130,246,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,72,153,0.10)' }}>
                      <Phone className="w-4 h-4" style={{ color: '#EC4899' }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>{t('labelWhatsapp')}</p>
                      <a
                        href="https://wa.me/41783339396"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-slate-800 hover:text-pink-500 transition-colors"
                      >
                        +41 78 333 93 96
                      </a>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{t('whatsappHint')}</p>
                      <div className="text-xs mt-1 space-y-0.5" style={{ color: '#94a3b8' }}>
                        <p><span className="font-medium text-slate-600">{t('monFri')}</span> 09:00–11:00 / 14:00–16:00 / 19:00–20:00</p>
                        <p><span className="font-medium text-slate-600">{t('weekendHolidays')}</span> 16:00–18:00</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0' }} />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,72,153,0.10)' }}>
                      <Mail className="w-4 h-4" style={{ color: '#EC4899' }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>{t('labelEmail')}</p>
                      <a href="mailto:info@nicemodels.ch" className="font-medium text-slate-800 hover:text-pink-500 transition-colors break-all">
                        info@nicemodels.ch
                      </a>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{t('emailHint')}</p>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0' }} />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(236,72,153,0.10)' }}>
                      <MapPin className="w-4 h-4" style={{ color: '#EC4899' }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#94a3b8' }}>{t('labelLocation')}</p>
                      <p className="font-medium text-slate-800">{t('locationValue')}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{t('locationHint')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="rounded-xl p-4 sm:p-5" style={{ background: '#ffffff', border: '1px solid rgba(59,130,246,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-2 sm:mb-3">{t('quickInfo')}</h3>
                <ul className="space-y-2 text-sm">
                  {[t('quickItem1'), t('quickItem2'), t('quickItem3'), t('quickItem4')].map(item => (
                    <li key={item} className="flex items-center gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Form - Right Side */}
            <div className="lg:col-span-2">
              <div className="rounded-xl p-4 sm:p-7" style={{ background: '#ffffff', border: '1px solid rgba(59,130,246,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900">{t('sendMessage')}</h2>
                  <p className="text-sm mt-1 text-slate-500">{t('sendMessageHint')}</p>
                </div>

                {success ? (
                  <div className="rounded-lg p-6 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.30)' }}>
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-800 mb-1">{t('messageSent')}</h3>
                    <p className="text-sm text-slate-500">{t('messageSentHint')}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    {error && (
                      <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">
                        {t('fieldEmail')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors text-slate-800 placeholder-slate-300"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        placeholder={t('emailPlaceholder')}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">
                          {t('fieldPhone')}
                        </label>
                        <PhoneInput
                          countryCode={phoneCountry}
                          phoneNumber={phoneNumber}
                          onCountryCodeChange={setPhoneCountry}
                          onPhoneNumberChange={setPhoneNumber}
                          placeholder={t('phonePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">
                          {t('fieldSubject')} <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => handleChange('subject', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors text-slate-800"
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        >
                          <option value="">{t('subjectPlaceholder')}</option>
                          <option value="general">{t('subjectGeneral')}</option>
                          <option value="model">{t('subjectModel')}</option>
                          <option value="club">{t('subjectClub')}</option>
                          <option value="verification">{t('subjectVerification')}</option>
                          <option value="technical">{t('subjectTechnical')}</option>
                          <option value="billing">{t('subjectBilling')}</option>
                          <option value="report">{t('subjectReport')}</option>
                          <option value="other">{t('subjectOther')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-slate-500">
                        {t('fieldMessage')} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        required
                        maxLength={1000}
                        rows={5}
                        className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 transition-colors resize-none text-slate-800 placeholder-slate-300"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                        placeholder={t('messagePlaceholder')}
                      />
                      <p className="text-xs mt-1 text-slate-400">{formData.message.length} / 1000</p>
                    </div>

                    <div className="rounded-lg p-3" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                      <p className="text-xs text-slate-500">{t('privacyNote')}</p>
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          {t('sending')}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t('sendBtn')}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-3 sm:mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-xl p-3 sm:p-4" style={{ background: '#ffffff', border: '1px solid rgba(59,130,246,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-1">{t('forModels')}</h3>
                  <p className="text-xs text-slate-500">{t('forModelsDesc')}</p>
                </div>
                <div className="rounded-xl p-3 sm:p-4" style={{ background: '#ffffff', border: '1px solid rgba(59,130,246,0.15)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-1">{t('forClubs')}</h3>
                  <p className="text-xs text-slate-500">{t('forClubsDesc')}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
