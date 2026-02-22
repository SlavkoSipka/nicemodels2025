'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, User, Building2, Mail, Calendar, UserCheck } from 'lucide-react'

interface BlockedUser {
  id: string
  email: string
  username: string
  role: string
  created_at: string
  blocked_at: string
  blocked_reason: string | null
  model_details?: {
    showname: string
  }
  club_details?: {
    club_name: string
  }
}

export default function AdminBlockedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])

  useEffect(() => {
    loadBlockedUsers()
  }, [])

  const loadBlockedUsers = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    // Load all blocked users
    const { data: users } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        username,
        role,
        created_at,
        blocked_at,
        blocked_reason,
        model_details (
          showname
        ),
        club_details (
          club_name
        )
      `)
      .eq('is_blocked', true)
      .order('blocked_at', { ascending: false })

    // Transform nested arrays to objects
    const transformedUsers = users?.map(user => ({
      ...user,
      model_details: Array.isArray(user.model_details) ? user.model_details[0] : user.model_details,
      club_details: Array.isArray(user.club_details) ? user.club_details[0] : user.club_details
    })) || []

    setBlockedUsers(transformedUsers)
    setLoading(false)
  }

  const handleUnblock = async (userId: string) => {
    if (!confirm('Are you sure you want to unblock this user?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        is_blocked: false,
        blocked_at: null,
        blocked_reason: null
      })
      .eq('id', userId)

    if (error) {
      alert('Failed to unblock user')
      return
    }

    // Refresh list
    loadBlockedUsers()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/admin" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blocked Users</h1>
          <p className="text-gray-600">Total Blocked: {blockedUsers.length}</p>
        </div>

        {/* Blocked Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Blocked Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {blockedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          user.role === 'model' ? 'bg-pink-100' : 'bg-blue-100'
                        }`}>
                          {user.role === 'model' ? (
                            <User className="w-5 h-5 text-pink-600" />
                          ) : (
                            <Building2 className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user.role === 'model'
                              ? user.model_details?.showname || user.username || 'N/A'
                              : user.club_details?.club_name || user.username || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">@{user.username || 'no-username'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        user.role === 'model'
                          ? 'bg-pink-100 text-pink-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'company' ? 'club' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(user.blocked_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.blocked_reason || 'No reason specified'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleUnblock(user.id)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-all flex items-center gap-1"
                      >
                        <UserCheck className="w-4 h-4" />
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {blockedUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No blocked users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
