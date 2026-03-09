'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, User, Building2, UserX, UserCheck } from 'lucide-react'

interface BlockedUser {
  id: string
  email: string
  username: string
  role: string
  created_at: string
  blocked_at: string
  blocked_reason: string | null
  model_details?: { showname: string }
  club_details?: { club_name: string }
}

export default function AdminBlockedPage() {
  const [loading, setLoading] = useState(true)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])

  useEffect(() => { load() }, [])

  const load = async () => {
    const supabase = createClient()

    const { data } = await supabase
      .from('profiles')
      .select('id, email, username, role, created_at, blocked_at, blocked_reason, model_details (showname), club_details (club_name)')
      .eq('is_blocked', true)
      .order('blocked_at', { ascending: false })

    setBlockedUsers((data || []).map(u => ({
      ...u,
      model_details: Array.isArray(u.model_details) ? u.model_details[0] : u.model_details,
      club_details: Array.isArray(u.club_details) ? u.club_details[0] : u.club_details,
    })))
    setLoading(false)
  }

  const handleUnblock = async (userId: string) => {
    if (!confirm('Unblock this user?')) return
    const supabase = createClient()
    await supabase.from('profiles').update({ is_blocked: false, blocked_at: null, blocked_reason: null }).eq('id', userId)
    load()
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
              <ArrowLeft className="w-3 h-3" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Blocked Users</h1>
                <p className="text-xs text-gray-500">{blockedUsers.length} blocked</p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['User', 'Email', 'Type', 'Blocked Date', 'Reason', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blockedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${user.role === 'model' ? 'bg-brand/10' : 'bg-blue-50'}`}>
                            {user.role === 'model' ? <User className="w-4 h-4 text-brand" /> : <Building2 className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.role === 'model' ? user.model_details?.showname || user.username || 'N/A' : user.club_details?.club_name || user.username || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-400">@{user.username || 'no-username'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${user.role === 'model' ? 'bg-brand/10 text-brand' : 'bg-blue-50 text-blue-700'}`}>
                          {user.role === 'company' ? 'club' : user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(user.blocked_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{user.blocked_reason || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleUnblock(user.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {blockedUsers.length === 0 && (
              <div className="text-center py-12">
                <UserCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No blocked users</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
