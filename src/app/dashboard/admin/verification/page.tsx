'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowLeft, ShieldCheck, User, Building2, X, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDobDisplay } from '@/lib/utils/dob'

interface Verification {
  id: string
  user_id: string
  first_name: string
  surname: string
  date_of_birth: string
  id_number: string
  id_card_photo_path: string
  selfie_photo_path: string
  video_path: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
  profile?: {
    email: string; username: string; public_id?: number; role: string
    model_details?: { showname: string } | null
    club_details?: { club_name: string } | null
  }
}

export default function AdminVerificationPage() {
  const t = useTranslations('admin.verification')
  const tc = useTranslations('admin.common')
  const [loading, setLoading] = useState(true)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [roleFilter, setRoleFilter] = useState<'all' | 'model' | 'user' | 'company'>('all')
  const [selected, setSelected] = useState<Verification | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [idCardUrl, setIdCardUrl] = useState('')
  const [selfieUrl, setSelfieUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!selected) { setIdCardUrl(''); setSelfieUrl(''); setVideoUrl(''); return }
    const loadUrls = async () => {
      try {
        const res = await fetch('/api/admin/verifications/urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idCardPath: selected.id_card_photo_path,
            selfiePath: selected.selfie_photo_path,
            videoPath: selected.video_path,
          }),
        })
        if (!res.ok) return
        const j = await res.json()
        setIdCardUrl(j.idCardUrl || '')
        setSelfieUrl(j.selfieUrl || '')
        setVideoUrl(j.videoUrl || '')
      } catch { /* */ }
    }
    loadUrls()
  }, [selected])

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/verifications', { cache: 'no-store' })
      if (!res.ok) {
        setVerifications([])
      } else {
        const j = await res.json()
        setVerifications(j.verifications || [])
      }
    } catch {
      setVerifications([])
    }
    setLoading(false)
  }

  const submitDecision = async (vId: string, userId: string, decision: 'approved' | 'rejected', reason?: string) => {
    const res = await fetch('/api/admin/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vId, userId, decision, reason }),
    })
    return res.ok
  }

  const handleApprove = async (vId: string, userId: string) => {
    setProcessing(true)
    try {
      await submitDecision(vId, userId, 'approved')
      setSelected(null); loadData()
    } catch { /* */ }
    setProcessing(false)
  }

  const handleReject = async (vId: string, userId: string) => {
    if (!rejectionReason.trim()) return
    setProcessing(true)
    try {
      await submitDecision(vId, userId, 'rejected', rejectionReason)
      setSelected(null); setRejectionReason(''); loadData()
    } catch { /* */ }
    setProcessing(false)
  }

  const filtered = verifications.filter(v => (filter === 'all' || v.status === filter) && (roleFilter === 'all' || v.profile?.role === roleFilter))
  const counts = { all: verifications.length, pending: verifications.filter(v => v.status === 'pending').length, approved: verifications.filter(v => v.status === 'approved').length, rejected: verifications.filter(v => v.status === 'rejected').length }

  const tabCls = (active: boolean) => `px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${active ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'}`

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4">

          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{t('title')}</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">{t('subtitle')}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setFilter('all')} className={tabCls(filter === 'all')}>{t('tabAll')} ({counts.all})</button>
              <button onClick={() => setFilter('pending')} className={tabCls(filter === 'pending')}>{t('tabPending')} ({counts.pending})</button>
              <button onClick={() => setFilter('approved')} className={tabCls(filter === 'approved')}>{t('tabApproved')} ({counts.approved})</button>
              <button onClick={() => setFilter('rejected')} className={tabCls(filter === 'rejected')}>{t('tabRejected')} ({counts.rejected})</button>
            </div>
            <div className="flex gap-1 flex-wrap">
              <button onClick={() => setRoleFilter('all')} className={tabCls(roleFilter === 'all')}>{t('rolesAll')}</button>
              <button onClick={() => setRoleFilter('model')} className={tabCls(roleFilter === 'model')}>{t('rolesModels')}</button>
              <button onClick={() => setRoleFilter('user')} className={tabCls(roleFilter === 'user')}>{t('rolesVisitors')}</button>
              <button onClick={() => setRoleFilter('company')} className={tabCls(roleFilter === 'company')}>{t('rolesClubs')}</button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('noRequests')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {[t('colUser'), t('colType'), t('colRealName'), t('colSubmitted'), t('colStatus'), ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${v.profile?.role === 'model' ? 'bg-brand/10' : v.profile?.role === 'company' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                              {v.profile?.role === 'model' ? <User className="w-4 h-4 text-brand" /> : v.profile?.role === 'company' ? <Building2 className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4 text-purple-600" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {v.profile?.model_details?.showname || v.profile?.club_details?.club_name || v.profile?.username || 'N/A'}
                                {v.profile?.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{v.profile.public_id}</span>}
                              </p>
                              <a href={`mailto:${v.profile?.email}`} className="text-xs text-gray-400 truncate hover:text-brand hover:underline">{v.profile?.email}</a>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v.profile?.role === 'model' ? 'bg-brand/10 text-brand' : v.profile?.role === 'company' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                            {v.profile?.role === 'model' ? t('typeModel') : v.profile?.role === 'company' ? t('typeClub') : v.profile?.role === 'user' ? t('typeVisitor') : v.profile?.role || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{v.first_name} {v.surname}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(v.submitted_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : v.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {v.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : v.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {v.status === 'approved' ? tc('approved') : v.status === 'rejected' ? tc('rejected') : tc('pending')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(v)} className="text-xs font-semibold text-brand hover:text-brand-hover">{t('review')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => { setSelected(null); setRejectionReason('') }}>
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                <h2 className="text-base font-bold text-gray-900">{t('modalTitle')}</h2>
              </div>
              <button onClick={() => { setSelected(null); setRejectionReason('') }}
                className="p-1 rounded-md hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* User info */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 sm:p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('userInformation')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                  <div className="break-words"><span className="text-gray-500">{t('fieldEmail')}:</span> <a href={`mailto:${selected.profile?.email}`} className="font-semibold ml-1 hover:text-brand hover:underline break-all">{selected.profile?.email}</a></div>
                  <div className="break-words"><span className="text-gray-500">{t('fieldUsername')}:</span> <span className="font-semibold ml-1">@{selected.profile?.username}</span></div>
                  <div><span className="text-gray-500">{t('fieldType')}:</span> <span className="font-semibold ml-1 capitalize">{selected.profile?.role === 'company' ? t('typeClub') : selected.profile?.role === 'user' ? t('typeVisitor') : selected.profile?.role === 'model' ? t('typeModel') : selected.profile?.role}</span></div>
                  <div><span className="text-gray-500">{t('fieldSubmitted')}:</span> <span className="font-semibold ml-1">{new Date(selected.submitted_at).toLocaleDateString()}</span></div>
                </div>
              </div>

              {/* Submitted info */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 sm:p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('submittedDetails')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                  <div><span className="text-gray-500">{t('fieldFirstName')}:</span> <span className="font-semibold ml-1">{selected.first_name}</span></div>
                  <div><span className="text-gray-500">{t('fieldSurname')}:</span> <span className="font-semibold ml-1">{selected.surname}</span></div>
                  <div><span className="text-gray-500">{t('fieldDateOfBirth')}:</span> <span className="font-semibold ml-1">{formatDobDisplay(selected.date_of_birth) || '—'}</span></div>
                  <div className="break-words"><span className="text-gray-500">{t('fieldIdNumber')}:</span> <span className="font-semibold ml-1">{selected.id_number}</span></div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('uploadedDocuments')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{t('idCardPhoto')}</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      {idCardUrl
                        ? <img src={idCardUrl} alt="ID Card" className="w-full h-44 object-contain" />
                        : <div className="h-44 flex items-center justify-center"><div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{t('selfieWithId')}</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      {selfieUrl
                        ? <img src={selfieUrl} alt="Selfie" className="w-full h-44 object-contain" />
                        : <div className="h-44 flex items-center justify-center"><div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                  </div>
                </div>
                {selected.video_path && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">{t('videoWithId')}</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      {videoUrl
                        ? <video src={videoUrl} controls className="w-full h-44" />
                        : <div className="h-44 flex items-center justify-center"><div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Current status banner */}
              {selected.status !== 'pending' && (
                <div className={`rounded-lg p-3 ${selected.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-xs font-bold mb-1 ${selected.status === 'approved' ? 'text-emerald-800' : 'text-red-800'}`}>
                    {selected.status === 'approved' ? t('currentlyApproved') : t('currentlyRejected')}
                  </p>
                  {selected.reviewed_at && (
                    <p className={`text-xs ${selected.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {t('reviewedOn', { date: new Date(selected.reviewed_at).toLocaleDateString() })}
                    </p>
                  )}
                  {selected.status === 'rejected' && selected.rejection_reason && (
                    <p className="text-sm text-red-700 mt-1">{selected.rejection_reason}</p>
                  )}
                </div>
              )}

              {/* Rejection input — shown when reject button is visible */}
              {selected.status !== 'rejected' && (
                <div>
                  <label className="text-xs font-bold text-gray-800 mb-1 block">{t('rejectionReasonLabel')}</label>
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    rows={2} placeholder={t('rejectionPlaceholder')} />
                </div>
              )}

              {/* Actions — always show relevant buttons */}
              <div className="flex gap-2 sm:gap-3 pt-1 flex-wrap sm:flex-nowrap">
                <button onClick={() => { setSelected(null); setRejectionReason('') }} disabled={processing}
                  className="flex-1 min-w-[88px] px-3 sm:px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
                  {tc('close')}
                </button>
                {selected.status !== 'rejected' && (
                  <button onClick={() => handleReject(selected.id, selected.user_id)} disabled={processing || !rejectionReason.trim()}
                    className="flex-1 min-w-[88px] px-3 sm:px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                    {processing ? '...' : selected.status === 'approved' ? t('changeToRejected') : tc('reject')}
                  </button>
                )}
                {selected.status !== 'approved' && (
                  <button onClick={() => handleApprove(selected.id, selected.user_id)} disabled={processing}
                    className="flex-1 min-w-[88px] px-3 sm:px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                    {processing ? '...' : selected.status === 'rejected' ? t('changeToApproved') : tc('approve')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
