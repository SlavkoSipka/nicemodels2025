'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Trash2, User, Building2, UserCircle } from 'lucide-react'

interface DeletedAccount {
  id: string
  original_user_id: string
  email: string
  username: string | null
  role: string | null
  reason: string | null
  deleted_by: string
  deleted_at: string
}

const roleIcon = (role: string | null) => {
  if (role === 'model') return <User className="w-4 h-4 text-brand" />
  if (role === 'company') return <Building2 className="w-4 h-4 text-blue-600" />
  return <UserCircle className="w-4 h-4 text-gray-500" />
}

export default function AdminDeletedPage() {
  const t = useTranslations('admin.deleted')
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<DeletedAccount[]>([])

  useEffect(() => { load() }, [])

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('deleted_accounts')
      .select('id, original_user_id, email, username, role, reason, deleted_by, deleted_at')
      .order('deleted_at', { ascending: false })
      .limit(500)
    setRows(data || [])
    setLoading(false)
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-4">

          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{t('title')}</h1>
                <p className="text-xs text-gray-500">{t('totalArchived', { count: rows.length })}</p>
              </div>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2.5">
            {rows.map(row => (
              <div key={row.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    {roleIcon(row.role)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">@{row.username || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{row.email}</p>
                      </div>
                      <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize bg-gray-100 text-gray-700 shrink-0">
                        {row.role === 'company' ? 'club' : (row.role || '—')}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-0.5 text-[11px] text-gray-500">
                      <p>{new Date(row.deleted_at).toLocaleString()}</p>
                      <p>{t('colDeletedBy')}: {row.deleted_by === 'self' ? <span className="font-semibold text-gray-700">{t('self')}</span> : <span className="font-mono">{row.deleted_by.slice(0, 8)}…</span>}</p>
                      {row.reason && <p className="break-words">{row.reason}</p>}
                      <p className="text-[10px] font-mono text-gray-400 truncate">{row.original_user_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg text-center py-8">
                <Trash2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('noAccounts')}</p>
              </div>
            )}
          </div>

          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {[t('colUser'), t('colEmail'), t('colRole'), t('colDeletedAt'), t('colDeletedBy'), t('colReason')].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                            {roleIcon(row.role)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">@{row.username || '—'}</p>
                            <p className="text-[10px] font-mono text-gray-400 truncate">{row.original_user_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate">{row.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-700">
                          {row.role === 'company' ? 'club' : (row.role || '—')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(row.deleted_at).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {row.deleted_by === 'self' ? <span className="font-semibold text-gray-700">{t('self')}</span> : <span className="font-mono">{row.deleted_by.slice(0, 8)}…</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[260px] truncate">{row.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <div className="hidden md:block text-center py-12">
                <Trash2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{t('noAccounts')}</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
