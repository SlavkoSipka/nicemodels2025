'use client'

import { useEffect, useState } from 'react'
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
      <div className="py-6 px-6">
        <div className="max-w-6xl mx-auto space-y-4">

          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Deleted Accounts</h1>
                <p className="text-xs text-gray-500">{rows.length} archived</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['User', 'Email', 'Role', 'Deleted At', 'Deleted By', 'Reason'].map(h => (
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
                        {row.deleted_by === 'self' ? <span className="font-semibold text-gray-700">self</span> : <span className="font-mono">{row.deleted_by.slice(0, 8)}…</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[260px] truncate">{row.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <div className="text-center py-12">
                <Trash2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No deleted accounts yet</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
