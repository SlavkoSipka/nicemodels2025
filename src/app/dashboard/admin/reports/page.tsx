'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Flag, CheckCircle, XCircle, Clock, Eye, X } from 'lucide-react'

interface Report {
  id: string
  created_at: string
  reason: string | null
  screenshot_path: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  reporter: { id: string; username: string; public_id: number | null; role: string }
  reported: { id: string; username: string; public_id: number | null; role: string }
  conversation_id: string | null
  screenshotUrl?: string | null
}

const STATUS_STYLES = {
  pending:   { color: 'bg-amber-50 text-amber-700',   icon: <Clock className="w-3 h-3" /> },
  reviewed:  { color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  dismissed: { color: 'bg-gray-100 text-gray-500',    icon: <XCircle className="w-3 h-3" /> },
}

export default function AdminReportsPage() {
  const t = useTranslations('admin.reports')
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'dismissed'>('pending')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { loadReports() }, [])

  const loadReports = async () => {
    const res = await fetch('/api/admin/reports')
    if (!res.ok) { setLoading(false); return }

    const { reports: data } = await res.json()
    const mapped: Report[] = (data || []).map((r: any) => ({
      ...r,
      reporter: r.reporter || { id: r.reporter_id, username: 'N/A', public_id: null, role: 'unknown' },
      reported: r.reported || { id: r.reported_id, username: 'N/A', public_id: null, role: 'unknown' },
      screenshotUrl: null,
    }))

    const pathsNeeding = [...new Set(mapped.map((r) => r.screenshot_path).filter(Boolean))] as string[]

    let urlByPath: Record<string, string> = {}
    if (pathsNeeding.length > 0) {
      try {
        const batchRes = await fetch('/api/admin/reports/screenshot-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: pathsNeeding }),
        })
        if (batchRes.ok) {
          const j = await batchRes.json()
          urlByPath = (j.urls as Record<string, string>) || {}
        }
      } catch {
        urlByPath = {}
      }
    }

    const withUrls = mapped.map((r) => ({
      ...r,
      screenshotUrl: r.screenshot_path ? urlByPath[r.screenshot_path] ?? null : null,
    }))

    setReports(withUrls)
    setLoading(false)
  }

  const updateStatus = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    setUpdating(reportId)
    const res = await fetch('/api/reports/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status }),
    })
    if (res.ok) {
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r))
    }
    setUpdating(null)
  }

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter)

  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length,
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <Flag className="w-5 h-5 text-red-500" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{t('title')}</h1>
                <p className="text-xs text-gray-500">{t('pendingReview', { count: counts.pending })}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-1.5 flex-wrap">
            {(['pending', 'all', 'reviewed', 'dismissed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {f === 'pending' ? t('filterPending') : f === 'all' ? t('filterAll') : f === 'reviewed' ? t('filterReviewed') : t('filterDismissed')}
                <span className="ml-1 opacity-60">{counts[f]}</span>
              </button>
            ))}
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2.5">
            {filtered.map(report => {
              const s = STATUS_STYLES[report.status]
              const statusLabel = report.status === 'pending' ? t('statusPending') : report.status === 'reviewed' ? t('statusReviewed') : t('statusDismissed')
              return (
                <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${s.color}`}>
                      {s.icon} {statusLabel}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">{t('colReportedBy')}</p>
                      <p className="font-semibold text-gray-900 truncate">
                        @{report.reporter?.username || 'N/A'}
                        {report.reporter?.public_id && <span className="ml-1 text-[10px] font-mono text-gray-400">#{report.reporter.public_id}</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 capitalize">{report.reporter?.role}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-400 text-[10px] uppercase font-bold mb-0.5">{t('colReportedUser')}</p>
                      <p className="font-semibold text-red-700 truncate">
                        @{report.reported?.username || 'N/A'}
                        {report.reported?.public_id && <span className="ml-1 text-[10px] font-mono text-red-400">#{report.reported.public_id}</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 capitalize">{report.reported?.role}</p>
                    </div>
                  </div>
                  {report.reason && (
                    <p className="text-xs text-gray-700 mb-2 break-words">{report.reason}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {report.screenshotUrl && (
                      <button onClick={() => setPreviewUrl(report.screenshotUrl!)}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {t('view')}
                      </button>
                    )}
                    {report.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(report.id, 'reviewed')} disabled={updating === report.id}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 disabled:opacity-50">
                          {t('reviewed')}
                        </button>
                        <button onClick={() => updateStatus(report.id, 'dismissed')} disabled={updating === report.id}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-gray-100 text-gray-600 disabled:opacity-50">
                          {t('dismiss')}
                        </button>
                        {report.reported && (
                          <Link href={`/dashboard/admin/${report.reported.role === 'model' ? 'models' : report.reported.role === 'company' ? 'clubs' : 'users'}${report.reported.role !== 'user' ? `/${report.reported.id}` : ''}`}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-red-50 text-red-700">
                            {t('viewProfile')}
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg text-center py-8">
                <Flag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('noReportsFound')}</p>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[t('colReportedBy'), t('colReportedUser'), t('colReason'), t('colScreenshot'), t('colDate'), t('colStatus'), t('colActions')].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">

                      {/* Reporter */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            @{report.reporter?.username || 'N/A'}
                            {report.reporter?.public_id && (
                              <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{report.reporter.public_id}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">{report.reporter?.role}</p>
                        </div>
                      </td>

                      {/* Reported */}
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-red-700">
                            @{report.reported?.username || 'N/A'}
                            {report.reported?.public_id && (
                              <span className="ml-1.5 text-[10px] font-mono text-red-400">#{report.reported.public_id}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">{report.reported?.role}</p>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-gray-700 truncate" title={report.reason || ''}>{report.reason || <span className="text-gray-400">—</span>}</p>
                      </td>

                      {/* Screenshot */}
                      <td className="px-4 py-3">
                        {report.screenshotUrl ? (
                          <button onClick={() => setPreviewUrl(report.screenshotUrl!)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
                            <Eye className="w-3 h-3" /> {t('view')}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">{t('noScreenshot')}</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(report.created_at).toLocaleDateString()}<br />
                        <span className="text-gray-400">{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {(() => {
                          const s = STATUS_STYLES[report.status]
                          const label = report.status === 'pending' ? t('statusPending') : report.status === 'reviewed' ? t('statusReviewed') : t('statusDismissed')
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                              {s.icon} {label}
                            </span>
                          )
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {report.status === 'pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateStatus(report.id, 'reviewed')}
                              disabled={updating === report.id}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                            >
                              {t('reviewed')}
                            </button>
                            <button
                              onClick={() => updateStatus(report.id, 'dismissed')}
                              disabled={updating === report.id}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              {t('dismiss')}
                            </button>
                            {report.reported && (
                              <Link
                                href={`/dashboard/admin/${report.reported.role === 'model' ? 'models' : report.reported.role === 'company' ? 'clubs' : 'users'}${report.reported.role !== 'user' ? `/${report.reported.id}` : ''}`}
                                className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              >
                                {t('viewProfile')}
                              </Link>
                            )}
                          </div>
                        )}
                        {report.status !== 'pending' && <span className="text-xs text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="hidden md:block text-center py-12">
                <Flag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('noReportsFound')}</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Screenshot preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70" onClick={() => setPreviewUrl(null)}>
          <div className="relative w-full sm:max-w-3xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)}
              className="absolute top-2 right-2 sm:-top-3 sm:-right-3 w-9 h-9 sm:w-8 sm:h-8 bg-white rounded-full shadow-lg flex items-center justify-center z-10">
              <X className="w-4 h-4 text-gray-700" />
            </button>
            <Image src={previewUrl} alt={t('screenshotAlt')} width={900} height={600} className="w-full rounded-xl object-contain max-h-[88vh]" />
          </div>
        </div>
      )}
    </div>
  )
}
