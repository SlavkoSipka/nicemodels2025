'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  MessageSquare, CheckCircle, XCircle, User, Phone, Mail,
  MapPin, Loader2, MessageCircle, Reply, ShieldCheck, Star, Sparkles,
} from 'lucide-react'

interface Comment {
  id: string
  comment_text: string
  rating: number | null
  status: string
  created_at: string
  reply_text: string | null
  replied_at: string | null
  user: {
    id: string; username: string; email: string
    phone: string | null; city: string | null; description: string | null
    avatar_url?: string | null
  }
  model: {
    id: string; username: string; email: string; public_id?: number | null
    model_details: Array<{ showname: string; city: string }>
    model_contact_details: Array<{
      phone_number: string; country_code: string
      has_whatsapp: boolean; has_viber: boolean; has_telegram: boolean
    }>
  }
}

type FilterKey = 'new' | 'reviewed' | 'rejected' | 'all'

const STATUS_STYLE: Record<string, { cls: string; icon: React.ReactNode }> = {
  approved: {
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Sparkles className="w-3 h-3" />,
  },
  reviewed: {
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  rejected: {
    cls: 'bg-red-50 text-red-700 border-red-200',
    icon: <XCircle className="w-3 h-3" />,
  },
  pending: {
    cls: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <Sparkles className="w-3 h-3" />,
  },
}

function statusBadgeKey(status: string): 'badgeNew' | 'badgeReviewed' | 'badgeRejected' | 'badgePending' {
  if (status === 'approved') return 'badgeNew'
  if (status === 'reviewed') return 'badgeReviewed'
  if (status === 'rejected') return 'badgeRejected'
  return 'badgePending'
}

function formatRelativePast(iso: string, locale: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0) {
    return new Date(iso).toLocaleString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return rtf.format(-Math.max(sec, 1), 'second')
  const min = Math.floor(diffMs / 60_000)
  if (min < 60) return rtf.format(-min, 'minute')
  const hours = Math.floor(min / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  const days = Math.floor(hours / 24)
  if (days < 30) return rtf.format(-days, 'day')
  const months = Math.floor(days / 30)
  if (months < 12) return rtf.format(-months, 'month')
  const years = Math.floor(months / 12)
  return rtf.format(-years, 'year')
}

export default function CommentsReviewClient({ comments: initialComments }: { comments: Comment[] }) {
  const t = useTranslations('admin.comments')
  const locale = useLocale()
  const [comments, setComments] = useState(initialComments)
  const [processing, setProcessing] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('new')

  const counts = useMemo(() => {
    let n = 0, r = 0, x = 0
    for (const c of comments) {
      if (c.status === 'approved' || c.status === 'pending') n++
      else if (c.status === 'reviewed') r++
      else if (c.status === 'rejected') x++
    }
    return { new: n, reviewed: r, rejected: x, all: comments.length }
  }, [comments])

  const filtered = useMemo(() => {
    if (filter === 'all') return comments
    if (filter === 'new') return comments.filter(c => c.status === 'approved' || c.status === 'pending')
    if (filter === 'reviewed') return comments.filter(c => c.status === 'reviewed')
    return comments.filter(c => c.status === 'rejected')
  }, [comments, filter])

  async function setStatus(id: string, status: 'reviewed' | 'rejected') {
    setProcessing(id)
    const supabase = createClient()
    const { error } = await supabase
      .from('model_comments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) setComments(cs => cs.map(c => c.id === id ? { ...c, status } : c))
    setProcessing(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Header */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{t('title')}</h1>
              <p className="text-xs text-gray-500 truncate">{t('intro')}</p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard
              active={filter === 'new'}
              onClick={() => setFilter('new')}
              label={t('tabNew')}
              count={counts.new}
              accent="amber"
              icon={<Sparkles className="w-4 h-4" />}
            />
            <StatCard
              active={filter === 'reviewed'}
              onClick={() => setFilter('reviewed')}
              label={t('tabReviewed')}
              count={counts.reviewed}
              accent="emerald"
              icon={<ShieldCheck className="w-4 h-4" />}
            />
            <StatCard
              active={filter === 'rejected'}
              onClick={() => setFilter('rejected')}
              label={t('tabRejected')}
              count={counts.rejected}
              accent="red"
              icon={<XCircle className="w-4 h-4" />}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-white'
              }`}
            >
              {t('showAll', { count: counts.all })}
            </button>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {filter === 'new' ? t('emptyNew')
                  : filter === 'reviewed' ? t('emptyReviewed')
                  : filter === 'rejected' ? t('emptyRejected')
                  : t('emptyAll')}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(comment => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  locale={locale}
                  processing={processing === comment.id}
                  onReview={() => setStatus(comment.id, 'reviewed')}
                  onReject={() => setStatus(comment.id, 'rejected')}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

/* ----------------------------- subcomponents ----------------------------- */

function StatCard({
  label, count, icon, accent, active, onClick,
}: {
  label: string
  count: number
  icon: React.ReactNode
  accent: 'amber' | 'emerald' | 'red'
  active: boolean
  onClick: () => void
}) {
  const accents = {
    amber: { ring: 'ring-amber-500', icon: 'bg-amber-50 text-amber-600', num: 'text-amber-700' },
    emerald: { ring: 'ring-emerald-500', icon: 'bg-emerald-50 text-emerald-600', num: 'text-emerald-700' },
    red: { ring: 'ring-red-500', icon: 'bg-red-50 text-red-600', num: 'text-red-700' },
  }[accent]
  return (
    <button
      onClick={onClick}
      className={`bg-white border rounded-xl p-3 sm:p-4 text-left transition-all hover:shadow-sm ${
        active ? `border-transparent ring-2 ${accents.ring}` : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${accents.icon}`}>{icon}</div>
        <span className={`text-xl sm:text-2xl font-bold tabular-nums ${count > 0 ? accents.num : 'text-gray-300'}`}>
          {count}
        </span>
      </div>
      <p className="text-xs font-semibold text-gray-700">{label}</p>
    </button>
  )
}

function CommentCard({
  comment, locale, processing, onReview, onReject,
}: {
  comment: Comment
  locale: string
  processing: boolean
  onReview: () => void
  onReject: () => void
}) {
  const t = useTranslations('admin.comments')
  const modelName = comment.model.model_details[0]?.showname || comment.model.username
  const contact = comment.model.model_contact_details[0]
  const style = STATUS_STYLE[comment.status] || STATUS_STYLE.pending
  const badgeLabel = t(statusBadgeKey(comment.status))
  const isNew = comment.status === 'approved' || comment.status === 'pending'
  const isReviewed = comment.status === 'reviewed'
  const isRejected = comment.status === 'rejected'

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-shadow hover:shadow-sm ${
      isNew ? 'border-amber-200' : isRejected ? 'border-red-100' : 'border-gray-200'
    }`}>
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-gray-100 bg-gray-50/60">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${style.cls}`}>
          {style.icon}
          {badgeLabel}
        </span>
        {comment.rating && (
          <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < comment.rating! ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
            ))}
          </span>
        )}
        <span className="ml-auto text-[11px] text-gray-400 tabular-nums shrink-0" title={new Date(comment.created_at).toLocaleString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}>
          {formatRelativePast(comment.created_at, locale)}
        </span>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Comment text */}
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
          {comment.comment_text}
        </div>

        {/* Reply */}
        {comment.reply_text && (
          <div className="flex items-start gap-2 pl-3 border-l-2 border-brand/30">
            <Reply className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-brand mb-0.5">
                {t('modelReplied', { name: modelName })}
                {comment.replied_at && (
                  <span className="font-normal text-gray-400 ml-1.5">· {formatRelativePast(comment.replied_at, locale)}</span>
                )}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{comment.reply_text}</p>
            </div>
          </div>
        )}

        {/* Parties */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <PartyBox
            tone="blue"
            title={t('commenter')}
            avatar={comment.user.avatar_url}
            name={comment.user.username || '—'}
            email={comment.user.email}
            phone={comment.user.phone || undefined}
            city={comment.user.city || undefined}
          />
          <PartyBox
            tone="brand"
            title={t('partyModelTitle')}
            name={modelName}
            email={comment.model.email}
            phone={contact?.phone_number ? `${contact.country_code} ${contact.phone_number}` : undefined}
            city={comment.model.model_details[0]?.city}
            modelLink={`/models/${comment.model.id}`}
            publicId={comment.model.public_id ?? undefined}
            messengers={contact}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {!isReviewed && (
            <button
              onClick={onReview}
              disabled={processing}
              className="flex-1 min-w-[140px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {processing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><ShieldCheck className="w-4 h-4" /> {t('markReviewed')}</>}
            </button>
          )}
          {!isRejected && (
            <button
              onClick={onReject}
              disabled={processing}
              className="flex-1 min-w-[140px] py-2 bg-white border border-red-300 hover:bg-red-50 text-red-700 text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {processing
                ? <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                : <><XCircle className="w-4 h-4" /> {t('reject')}</>}
            </button>
          )}
          {isReviewed && (
            <button
              onClick={() => onReject()}
              disabled={processing}
              className="ml-auto py-1.5 px-3 text-xs font-semibold text-gray-500 hover:text-red-700 transition-colors"
            >
              {t('takeOffline')}
            </button>
          )}
        </div>

        {isNew && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1.5">
            {t('hintNew')}
          </p>
        )}
        {isRejected && (
          <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">
            {t('hintRejected')}
          </p>
        )}
      </div>
    </div>
  )
}

function PartyBox({
  tone, title, avatar, name, email, phone, city, modelLink, publicId, messengers,
}: {
  tone: 'blue' | 'brand'
  title: string
  avatar?: string | null
  name: string
  email?: string
  phone?: string
  city?: string
  modelLink?: string
  publicId?: number
  messengers?: { has_whatsapp: boolean; has_viber: boolean; has_telegram: boolean; phone_number: string } | undefined
}) {
  const t = tone === 'blue'
    ? { wrap: 'border-blue-100 bg-blue-50/50', icon: 'text-blue-600' }
    : { wrap: 'border-brand/20 bg-brand/5', icon: 'text-brand' }

  return (
    <div className={`border rounded-lg p-2.5 ${t.wrap}`}>
      <p className="text-[11px] font-bold text-gray-700 mb-1.5 flex items-center gap-1">
        <User className={`w-3 h-3 ${t.icon}`} /> {title}
      </p>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          {avatar
            ? <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
            : null}
          {modelLink ? (
            <Link href={modelLink} className="font-semibold text-gray-800 hover:text-brand hover:underline truncate">
              {name}
              {publicId != null && <span className="ml-1 text-[10px] font-mono text-gray-400">#{publicId}</span>}
            </Link>
          ) : (
            <p className="font-semibold text-gray-800 truncate">{name}</p>
          )}
        </div>
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-1 hover:text-brand hover:underline truncate">
            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{email}</span>
          </a>
        )}
        {phone && (
          <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{phone}</p>
        )}
        {city && (
          <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{city}</p>
        )}
        {messengers?.phone_number && (messengers.has_whatsapp || messengers.has_viber || messengers.has_telegram) && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-0.5">
            {messengers.has_whatsapp && <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3 text-green-600" />WhatsApp</span>}
            {messengers.has_viber && <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3 text-purple-600" />Viber</span>}
            {messengers.has_telegram && <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3 text-blue-500" />Telegram</span>}
          </p>
        )}
      </div>
    </div>
  )
}
