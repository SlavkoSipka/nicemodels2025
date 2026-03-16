'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Ban, CheckCircle, Search, UserCircle, Pencil, Check, X } from 'lucide-react'

interface Visitor {
  id: string
  email: string
  username: string
  public_id: number | null
  created_at: string
  is_blocked: boolean
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editUsername, setEditUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadVisitors() }, [])

  const loadVisitors = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, username, public_id, created_at, is_blocked')
      .eq('role', 'user')
      .order('created_at', { ascending: false })

    if (error) { setLoading(false); return }

    setVisitors(data || [])
    setLoading(false)
  }

  const handleBlock = async (userId: string, blocked: boolean) => {
    if (!confirm(`${blocked ? 'Unblock' : 'Block'} this visitor?`)) return
    const res = await fetch('/api/admin/block-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, block: !blocked }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Failed to update block status')
      return
    }
    loadVisitors()
  }

  const startEdit = (visitor: Visitor) => {
    setEditingId(visitor.id)
    setEditUsername(visitor.username || '')
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditUsername('')
  }

  const saveEdit = async (userId: string) => {
    if (!editUsername.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/update-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username: editUsername.trim() }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || 'Failed to update username')
    } else {
      setVisitors(prev => prev.map(v => v.id === userId ? { ...v, username: editUsername.trim() } : v))
      setEditingId(null)
      setEditUsername('')
    }
    setSaving(false)
  }

  const filtered = visitors.filter(v => {
    const q = searchTerm.toLowerCase()
    if (!q) return true
    if (v.public_id && (`#${v.public_id}` === q || String(v.public_id) === q)) return true
    return v.email?.toLowerCase().includes(q) ||
      v.username?.toLowerCase().includes(q)
  })

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <Link href="/dashboard/admin" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-brand mb-3">
              <ArrowLeft className="w-3 h-3" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Visitors Management</h1>
                <p className="text-xs text-gray-500">{visitors.length} total visitors</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by ID, email, or username..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Visitor', 'Email', 'Joined', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(visitor => (
                    <tr key={visitor.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                            <UserCircle className="w-4 h-4 text-violet-600" />
                          </div>
                          <div className="min-w-0">
                            {editingId === visitor.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  ref={editInputRef}
                                  value={editUsername}
                                  onChange={e => setEditUsername(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(visitor.id); if (e.key === 'Escape') cancelEdit() }}
                                  className="text-sm border border-violet-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-violet-400 w-32"
                                />
                                <button onClick={() => saveEdit(visitor.id)} disabled={saving} className="p-0.5 text-emerald-600 hover:text-emerald-700">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={cancelEdit} className="p-0.5 text-gray-400 hover:text-gray-600">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {visitor.username || 'N/A'}
                                {visitor.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{visitor.public_id}</span>}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[220px] truncate">{visitor.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(visitor.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {visitor.is_blocked ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                            <Ban className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEdit(visitor)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors bg-violet-50 text-violet-700 hover:bg-violet-100 inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleBlock(visitor.id, visitor.is_blocked)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                              visitor.is_blocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}>
                            {visitor.is_blocked ? 'Unblock' : 'Block'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-gray-400">No visitors found</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
