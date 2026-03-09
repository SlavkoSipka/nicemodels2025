'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Phone, Mail, MapPin, Send, CheckCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    // Simulate sending (replace with actual email sending later)
    await new Promise(resolve => setTimeout(resolve, 1500))

    setSending(false)
    setSuccess(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setSuccess(false)
    }, 3000)
  }

  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)', minHeight: '100vh' }}>
        {/* Minimal header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-semibold text-white">Contact</h1>
            <p className="text-sm text-white/70 mt-1">Reach out anytime.</p>
            <p className="text-sm text-white/70 mt-3 px-3 py-2 rounded-lg max-w-2xl" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}>
              <span className="font-medium text-white">Beta:</span> We're still improving the site. If you notice any issues or have feedback, please get in touch — we'd love to hear from you.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-12 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Information - Left Side */}
            <div className="lg:col-span-1 space-y-4">
              {/* Contact */}
              <div className="rounded-xl p-5" style={{ background: '#272a31', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
                      <Phone className="w-4 h-4" style={{ color: '#93C5FD' }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Phone</p>
                      <a href="tel:+41443334455" className="font-medium text-white hover:text-pink-400 transition-colors">
                        +41 44 333 44 55
                      </a>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Mon–Fri 9am–6pm CET</p>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
                      <Mail className="w-4 h-4" style={{ color: '#93C5FD' }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Email</p>
                      <a href="mailto:info@nicemodels.ch" className="font-medium text-white hover:text-pink-400 transition-colors break-all">
                        info@nicemodels.ch
                      </a>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Reply within 24h</p>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
                      <MapPin className="w-4 h-4" style={{ color: '#93C5FD' }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Location</p>
                      <p className="font-medium text-white">Zurich, Switzerland</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Serving all of Switzerland</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="rounded-xl p-5" style={{ background: '#272a31', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                <h3 className="text-sm font-semibold text-white mb-3">Quick Info</h3>
                <ul className="space-y-2 text-sm">
                  {['24/7 platform access', 'Verified profiles', 'Safe & secure', 'Switzerland wide'].map(item => (
                    <li key={item} className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contact Form - Right Side */}
            <div className="lg:col-span-2">
              <div className="rounded-xl p-6 sm:p-7" style={{ background: '#272a31', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">Send a message</h2>
                  <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>We'll get back to you as soon as possible.</p>
                </div>

                {success ? (
                  <div className="rounded-lg p-6 text-center" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)' }}>
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-white mb-1">Message sent</h3>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>We'll reply within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Full name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors text-white placeholder-white/25"
                          style={{ background: '#1e2025', border: '1px solid rgba(255,255,255,0.1)' }}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors text-white placeholder-white/25"
                          style={{ background: '#1e2025', border: '1px solid rgba(255,255,255,0.1)' }}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors text-white placeholder-white/25"
                          style={{ background: '#1e2025', border: '1px solid rgba(255,255,255,0.1)' }}
                          placeholder="+41 79 123 45 67"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Subject <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => handleChange('subject', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors text-white"
                          style={{ background: '#1e2025', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                          <option value="" style={{ background: '#1e2025' }}>Select a subject</option>
                          <option value="general" style={{ background: '#1e2025' }}>General Inquiry</option>
                          <option value="model" style={{ background: '#1e2025' }}>Model Registration</option>
                          <option value="club" style={{ background: '#1e2025' }}>Club/Agency Registration</option>
                          <option value="verification" style={{ background: '#1e2025' }}>Account Verification</option>
                          <option value="technical" style={{ background: '#1e2025' }}>Technical Support</option>
                          <option value="billing" style={{ background: '#1e2025' }}>Billing & Payments</option>
                          <option value="report" style={{ background: '#1e2025' }}>Report an Issue</option>
                          <option value="other" style={{ background: '#1e2025' }}>Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        required
                        rows={5}
                        className="w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none transition-colors resize-none text-white placeholder-white/25"
                        style={{ background: '#1e2025', border: '1px solid rgba(255,255,255,0.1)' }}
                        placeholder="How can we help?"
                      />
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{formData.message.length} / 1000</p>
                    </div>

                    <div className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Your data is kept confidential and only used to respond. We never share it with third parties.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full py-3 px-4 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: '#272a31', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  <h3 className="text-sm font-semibold text-white mb-1">For models</h3>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Registration, verification or advertising — we're here to help.
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: '#272a31', border: '1px solid rgba(59,130,246,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                  <h3 className="text-sm font-semibold text-white mb-1">For clubs & agencies</h3>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    List your club or agency. Contact us for packages and benefits.
                  </p>
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
