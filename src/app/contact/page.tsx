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
      <div className="bg-gray-50">
        {/* Minimal header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-semibold text-gray-900">Contact</h1>
            <p className="text-sm text-gray-500 mt-1">Reach out anytime.</p>
            <p className="text-sm text-gray-500 mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200/80 max-w-2xl">
              <span className="font-medium text-amber-800">Beta:</span> We're still improving the site. If you notice any issues or have feedback, please get in touch — we'd love to hear from you.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-12 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Information - Left Side */}
            <div className="lg:col-span-1 space-y-4">
              {/* Contact */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                      <a href="tel:+41443334455" className="text-gray-900 font-medium hover:text-brand transition-colors">
                        +41 44 333 44 55
                      </a>
                      <p className="text-xs text-gray-500 mt-0.5">Mon–Fri 9am–6pm CET</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                      <a href="mailto:info@nicemodels.ch" className="text-gray-900 font-medium hover:text-brand transition-colors break-all">
                        info@nicemodels.ch
                      </a>
                      <p className="text-xs text-gray-500 mt-0.5">Reply within 24h</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Location</p>
                      <p className="text-gray-900 font-medium">Zurich, Switzerland</p>
                      <p className="text-xs text-gray-500 mt-0.5">Serving all of Switzerland</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Info</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    24/7 platform access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    Verified profiles
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    Safe & secure
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    Switzerland wide
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Form - Right Side */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-7">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Send a message</h2>
                  <p className="text-sm text-gray-500 mt-1">We'll get back to you as soon as possible.</p>
                </div>

                {success ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">Message sent</h3>
                    <p className="text-sm text-gray-600">We'll reply within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                          Full name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
                          placeholder="+41 79 123 45 67"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.subject}
                          onChange={(e) => handleChange('subject', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors bg-white"
                        >
                          <option value="">Select a subject</option>
                          <option value="general">General Inquiry</option>
                          <option value="model">Model Registration</option>
                          <option value="club">Club/Agency Registration</option>
                          <option value="verification">Account Verification</option>
                          <option value="technical">Technical Support</option>
                          <option value="billing">Billing & Payments</option>
                          <option value="report">Report an Issue</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        required
                        rows={5}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors resize-none"
                        placeholder="How can we help?"
                      />
                      <p className="text-xs text-gray-400 mt-1">{formData.message.length} / 1000</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                      <p className="text-xs text-gray-600">
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
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">For models</h3>
                  <p className="text-xs text-gray-600">
                    Registration, verification or advertising — we're here to help.
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">For clubs & agencies</h3>
                  <p className="text-xs text-gray-600">
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
