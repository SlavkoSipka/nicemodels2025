'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, X, Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface AdminMessageButtonProps {
  userId: string
  recipientEmail?: string | null
  recipientName?: string | null
  /** Pre-fill the subject line, e.g. "Update on your profile". */
  defaultSubject?: string
  /** Pre-fill the message body, e.g. "We hid one of your photos because…". */
  defaultBody?: string
  /** Visual variant. */
  variant?: 'button' | 'compact'
  className?: string
}

/**
 * Small button + modal that lets an administrator send a free-form
 * message to a single user. The server always creates an in-app
 * notification; sending the email is optional via the checkbox.
 */
export default function AdminMessageButton({
  userId,
  recipientEmail,
  recipientName,
  defaultSubject = '',
  defaultBody = '',
  variant = 'button',
  className = '',
}: AdminMessageButtonProps) {
  const t = useTranslations('admin.messageButton')
  const tc = useTranslations('admin.common')
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState(defaultSubject)
  const [body, setBody] = useState(defaultBody)
  const [sendEmail, setSendEmail] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (open) {
      setSubject(defaultSubject)
      setBody(defaultBody)
      setSendEmail(true)
      setError('')
      setSuccess('')
    }
  }, [open, defaultSubject, defaultBody])

  const handleSend = async () => {
    setError('')
    setSuccess('')
    if (!subject.trim()) { setError(t('subjectRequired')); return }
    if (!body.trim()) { setError(t('messageRequired')); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subject: subject.trim(),
          body: body.trim(),
          sendEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('failedToSend'))

      const emailNote = !sendEmail
        ? t('deliveredInApp')
        : data?.email?.skipped === 'unsubscribed'
          ? t('skippedUnsubscribed')
          : data?.email?.skipped === 'no_provider'
            ? t('skippedNoProvider')
            : data?.email?.ok
              ? t('deliveredEmail')
              : t('deliveredEmailFailed')
      setSuccess(emailNote)
      setTimeout(() => { setOpen(false) }, 1500)
    } catch (e) {
      setError((e as Error).message || t('failedToSend'))
    } finally {
      setSubmitting(false)
    }
  }

  const triggerCls = variant === 'compact'
    ? 'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100'
    : 'inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${triggerCls} ${className}`}
        title={t('triggerTitle')}
      >
        <Mail className={variant === 'compact' ? 'w-3 h-3' : 'w-4 h-4'} />
        {t('trigger')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !submitting && setOpen(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{t('title')}</h3>
                  <p className="text-[11px] text-gray-500">
                    {t('to')} <span className="font-medium text-gray-700">{recipientName || recipientEmail || t('user')}</span>
                    {recipientEmail && recipientName && (
                      <span className="text-gray-400"> · {recipientEmail}</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-800">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">{t('subject')}</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={120}
                  placeholder={t('subjectPlaceholder')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">{t('message')}</label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  placeholder={t('messagePlaceholder')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-y"
                  disabled={submitting}
                />
                <p className="text-[10px] text-gray-400 mt-1 text-right">{body.length}/2000</p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={submitting}
                />
                <span className="text-xs text-gray-700">
                  {t('alsoSendEmail')}
                  {recipientEmail ? (
                    <span className="text-gray-400"> ({recipientEmail})</span>
                  ) : (
                    <span className="text-amber-600"> {t('noEmailOnFile')}</span>
                  )}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="px-3.5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handleSend}
                disabled={submitting || !subject.trim() || !body.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? t('sending') : t('send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
