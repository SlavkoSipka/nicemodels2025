'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, User, Building2, X, Clock, CheckCircle, XCircle } from 'lucide-react'

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
    email: string; username: string; role: string
    model_details?: { showname: string } | null
    club_details?: { club_name: string } | null
  }
}

export default function AdminVerificationPage() {
  const [loading, setLoading] = useState(true)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selected, setSelected] = useState<Verification | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [idCardUrl, setIdCardUrl] = useState('')
  const [selfieUrl, setSelfieUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!selected) { setIdCardUrl(''); setSelfieUrl(''); setVideoUrl(''); return }
    const loadUrls = async () => {
      const { data: id } = await supabase.storage.from('verification-documents').createSignedUrl(selected.id_card_photo_path, 3600)
      if (id) setIdCardUrl(id.signedUrl)
      const { data: selfie } = await supabase.storage.from('verification-documents').createSignedUrl(selected.selfie_photo_path, 3600)
      if (selfie) setSelfieUrl(selfie.signedUrl)
      if (selected.video_path) {
        const { data: video } = await supabase.storage.from('verification-documents').createSignedUrl(selected.video_path, 3600)
        if (video) setVideoUrl(video.signedUrl)
      }
    }
    loadUrls()
  }, [selected, supabase])

  const loadData = async () => {
    const { data: vData } = await supabase.from('verifications').select('*').order('submitted_at', { ascending: false })
    if (vData && vData.length > 0) {
      const withProfiles = await Promise.all(vData.map(async v => {
        const { data: p } = await supabase.from('profiles').select('email, username, public_id, role, model_details!model_details_model_id_fkey (showname), club_details!club_details_club_id_fkey (club_name)').eq('id', v.user_id).single()
        const tp = p ? { ...p, model_details: Array.isArray(p.model_details) ? p.model_details[0] : p.model_details, club_details: Array.isArray(p.club_details) ? p.club_details[0] : p.club_details } : null
        return { ...v, profile: tp }
      }))
      setVerifications(withProfiles)
    } else {
      setVerifications([])
    }
    setLoading(false)
  }

  const handleApprove = async (vId: string, userId: string) => {
    setProcessing(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      await supabase.from('verifications').update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: user.id, rejection_reason: null }).eq('id', vId)
      await supabase.from('profiles').update({ is_verified: true }).eq('id', userId)
      setSelected(null); loadData()
    } catch { /* */ }
    setProcessing(false)
  }

  const handleReject = async (vId: string, userId: string) => {
    if (!rejectionReason.trim()) return
    setProcessing(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    try {
      await supabase.from('verifications').update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: user.id, rejection_reason: rejectionReason }).eq('id', vId)
      await supabase.from('profiles').update({ is_verified: false }).eq('id', userId)
      setSelected(null); setRejectionReason(''); loadData()
    } catch { /* */ }
    setProcessing(false)
  }

  const filtered = verifications.filter(v => filter === 'all' || v.status === filter)
  const counts = { all: verifications.length, pending: verifications.filter(v => v.status === 'pending').length, approved: verifications.filter(v => v.status === 'approved').length, rejected: verifications.filter(v => v.status === 'rejected').length }

  const tabCls = (active: boolean) => `px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${active ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'}`

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-6xl mx-auto space-y-4">

          <div>
            <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
              <ArrowLeft className="w-3 h-3" /> Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Verification Requests</h1>
                  <p className="text-xs text-gray-500">Review and approve identity verifications</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setFilter('all')} className={tabCls(filter === 'all')}>All ({counts.all})</button>
                <button onClick={() => setFilter('pending')} className={tabCls(filter === 'pending')}>Pending ({counts.pending})</button>
                <button onClick={() => setFilter('approved')} className={tabCls(filter === 'approved')}>Approved ({counts.approved})</button>
                <button onClick={() => setFilter('rejected')} className={tabCls(filter === 'rejected')}>Rejected ({counts.rejected})</button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No verification requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['User', 'Type', 'Real Name', 'Submitted', 'Status', ''].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${v.profile?.role === 'model' ? 'bg-brand/10' : 'bg-blue-50'}`}>
                              {v.profile?.role === 'model' ? <User className="w-4 h-4 text-brand" /> : <Building2 className="w-4 h-4 text-blue-600" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {v.profile?.model_details?.showname || v.profile?.club_details?.club_name || v.profile?.username || 'N/A'}
                                {v.profile?.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{v.profile.public_id}</span>}
                              </p>
                              <p className="text-xs text-gray-400 truncate">{v.profile?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${v.profile?.role === 'model' ? 'bg-brand/10 text-brand' : 'bg-blue-50 text-blue-700'}`}>
                            {v.profile?.role === 'model' ? 'Model' : v.profile?.role === 'company' ? 'Club' : v.profile?.role || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{v.first_name} {v.surname}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(v.submitted_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                            v.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : v.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {v.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : v.status === 'rejected' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(v)} className="text-xs font-semibold text-brand hover:text-brand-hover">Review</button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelected(null); setRejectionReason('') }}>
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                <h2 className="text-base font-bold text-gray-900">Review Verification</h2>
              </div>
              <button onClick={() => { setSelected(null); setRejectionReason('') }}
                className="p-1 rounded-md hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
            </div>

            <div className="p-5 space-y-4">
              {/* User info */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">User Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Email:</span> <span className="font-semibold ml-1">{selected.profile?.email}</span></div>
                  <div><span className="text-gray-500">Username:</span> <span className="font-semibold ml-1">@{selected.profile?.username}</span></div>
                  <div><span className="text-gray-500">Type:</span> <span className="font-semibold ml-1 capitalize">{selected.profile?.role === 'company' ? 'Club' : selected.profile?.role}</span></div>
                  <div><span className="text-gray-500">Submitted:</span> <span className="font-semibold ml-1">{new Date(selected.submitted_at).toLocaleDateString()}</span></div>
                </div>
              </div>

              {/* Submitted info */}
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Submitted Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">First Name:</span> <span className="font-semibold ml-1">{selected.first_name}</span></div>
                  <div><span className="text-gray-500">Surname:</span> <span className="font-semibold ml-1">{selected.surname}</span></div>
                  <div><span className="text-gray-500">Date of Birth:</span> <span className="font-semibold ml-1">{selected.date_of_birth}</span></div>
                  <div><span className="text-gray-500">ID Number:</span> <span className="font-semibold ml-1">{selected.id_number}</span></div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Uploaded Documents</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">ID Card Photo</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      {idCardUrl
                        ? <img src={idCardUrl} alt="ID Card" className="w-full h-44 object-contain" />
                        : <div className="h-44 flex items-center justify-center"><div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">Selfie with ID</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      {selfieUrl
                        ? <img src={selfieUrl} alt="Selfie" className="w-full h-44 object-contain" />
                        : <div className="h-44 flex items-center justify-center"><div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /></div>}
                    </div>
                  </div>
                </div>
                {selected.video_path && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Video with ID</p>
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
                    Currently {selected.status === 'approved' ? 'Approved' : 'Rejected'}
                  </p>
                  {selected.reviewed_at && (
                    <p className={`text-xs ${selected.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
                      Reviewed on {new Date(selected.reviewed_at).toLocaleDateString()}
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
                  <label className="text-xs font-bold text-gray-800 mb-1 block">Rejection Reason (required to reject)</label>
                  <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                    rows={2} placeholder="Enter reason for rejection..." />
                </div>
              )}

              {/* Actions — always show relevant buttons */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setSelected(null); setRejectionReason('') }} disabled={processing}
                  className="flex-1 px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">
                  Close
                </button>
                {selected.status !== 'rejected' && (
                  <button onClick={() => handleReject(selected.id, selected.user_id)} disabled={processing || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                    {processing ? 'Processing...' : selected.status === 'approved' ? 'Change to Rejected' : 'Reject'}
                  </button>
                )}
                {selected.status !== 'approved' && (
                  <button onClick={() => handleApprove(selected.id, selected.user_id)} disabled={processing}
                    className="flex-1 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                    {processing ? 'Processing...' : selected.status === 'rejected' ? 'Change to Approved' : 'Approve'}
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
