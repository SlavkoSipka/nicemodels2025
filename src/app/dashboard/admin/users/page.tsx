'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Ban, CheckCircle, Search, UserCircle, Pencil, Trash2, X, Save, AlertCircle, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { downloadXlsx, fmtDateTime } from '@/lib/exportXlsx'
import { formatDobDisplay } from '@/lib/utils/dob'
import DobInput from '@/components/forms/DobInput'
import AdminMessageButton from '@/components/admin/AdminMessageButton'

interface Visitor {
  id: string
  email: string
  username: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  date_of_birth: string | null
  city: string | null
  description: string | null
  public_id: number | null
  created_at: string
  is_blocked: boolean
  avatar_url: string | null
}

interface EditForm {
  username: string
  first_name: string
  last_name: string
  phone: string
  date_of_birth: string
  city: string
  description: string
  is_blocked: boolean
}

type SortKey = 'username' | 'email' | 'phone' | 'city' | 'created_at' | 'is_blocked'

export default function AdminUsersPage() {
  const t = useTranslations('admin.users')
  const tc = useTranslations('admin.common')
  const tSb = useTranslations('admin.sidebar')
  const [loading, setLoading] = useState(true)
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  useEffect(() => { loadVisitors() }, [])

  const loadVisitors = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, email, username, first_name, last_name, phone, date_of_birth, city, description, public_id, created_at, is_blocked, avatar_url')
      .eq('role', 'user')
      .order('created_at', { ascending: false })

    setVisitors(data || [])
    setLoading(false)
  }

  const openEdit = (v: Visitor) => {
    setEditingVisitor(v)
    setEditForm({
      username: v.username || '',
      first_name: v.first_name || '',
      last_name: v.last_name || '',
      phone: v.phone || '',
      date_of_birth: v.date_of_birth || '',
      city: v.city || '',
      description: v.description || '',
      is_blocked: v.is_blocked,
    })
    setEditError('')
    setEditSuccess('')
  }

  const closeEdit = () => {
    setEditingVisitor(null)
    setEditForm(null)
    setEditError('')
    setEditSuccess('')
  }

  const handleSave = async () => {
    if (!editingVisitor || !editForm) return
    if (!editForm.username.trim()) { setEditError(t('usernameRequired')); return }

    setSaving(true)
    setEditError('')
    setEditSuccess('')

    try {
      const res = await fetch('/api/admin/update-visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingVisitor.id,
          username: editForm.username.trim(),
          first_name: editForm.first_name.trim() || null,
          last_name: editForm.last_name.trim() || null,
          phone: editForm.phone.trim() || null,
          date_of_birth: editForm.date_of_birth || null,
          city: editForm.city.trim() || null,
          description: editForm.description.trim() || null,
          is_blocked: editForm.is_blocked,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || tc('failedToSave'))
      }

      setEditSuccess(tc('savedSuccessShort'))
      setVisitors(prev => prev.map(v =>
        v.id === editingVisitor.id
          ? {
              ...v,
              username: editForm.username.trim(),
              first_name: editForm.first_name.trim() || null,
              last_name: editForm.last_name.trim() || null,
              phone: editForm.phone.trim() || null,
              date_of_birth: editForm.date_of_birth || null,
              city: editForm.city.trim() || null,
              description: editForm.description.trim() || null,
              is_blocked: editForm.is_blocked,
            }
          : v
      ))
      setTimeout(() => setEditSuccess(''), 2000)
    } catch (e: any) {
      setEditError(e.message || tc('failedToSave'))
    } finally {
      setSaving(false)
    }
  }

  const handleBlock = async (userId: string, currentlyBlocked: boolean) => {
    if (!confirm(t('confirmBlock'))) return
    const res = await fetch('/api/admin/update-visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, is_blocked: !currentlyBlocked }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || tc('failedToUpdate'))
      return
    }
    setVisitors(prev => prev.map(v => v.id === userId ? { ...v, is_blocked: !currentlyBlocked } : v))
  }

  const handleDelete = async (visitor: Visitor) => {
    const confirmation = prompt(`${t('confirmDeletePrefix')} "${visitor.username || visitor.email}".\n${tc('thisCannotBeUndone')}`)
    if (confirmation !== 'DELETE') return

    try {
      const res = await fetch('/api/admin/update-visitor', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: visitor.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || tc('failedToDelete'))
      }
      setVisitors(prev => prev.filter(v => v.id !== visitor.id))
      if (editingVisitor?.id === visitor.id) closeEdit()
    } catch (e: any) {
      alert(e.message || t('deleteFailed'))
    }
  }

  const filtered = visitors.filter(v => {
    const q = searchTerm.toLowerCase()
    if (!q) return true
    if (v.public_id && (`#${v.public_id}` === q || String(v.public_id) === q)) return true
    return v.email?.toLowerCase().includes(q) ||
      v.username?.toLowerCase().includes(q) ||
      v.first_name?.toLowerCase().includes(q) ||
      v.last_name?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    const va = (a as any)[sortKey]
    const vb = (b as any)[sortKey]
    if (sortKey === 'created_at') {
      return (new Date(va || 0).getTime() - new Date(vb || 0).getTime()) * dir
    }
    if (sortKey === 'is_blocked') {
      return ((va === vb) ? 0 : (va ? 1 : -1)) * dir
    }
    const sa = (va || '').toString().toLowerCase()
    const sb = (vb || '').toString().toLowerCase()
    return sa.localeCompare(sb) * dir
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'created_at' ? 'desc' : 'asc')
    }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-gray-300" />
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-gray-700" />
      : <ArrowDown className="w-3 h-3 text-gray-700" />
  }

  const handleDownloadXlsx = () => {
    downloadXlsx('nicemodels-visitors', sorted, [
      { header: 'Public ID', value: v => v.public_id ?? '', width: 10 },
      { header: 'Username', value: v => v.username || '', width: 20 },
      { header: 'First Name', value: v => v.first_name || '', width: 18 },
      { header: 'Last Name', value: v => v.last_name || '', width: 18 },
      { header: 'Email', value: v => v.email || '', width: 30 },
      { header: 'Phone', value: v => v.phone || '', text: true, width: 22 },
      { header: 'City', value: v => v.city || '', width: 18 },
      { header: 'Date of Birth', value: v => formatDobDisplay(v.date_of_birth), text: true, width: 14 },
      { header: 'Joined', value: v => fmtDateTime(v.created_at), text: true, width: 20 },
      { header: 'Blocked', value: v => v.is_blocked ? 'Yes' : 'No', width: 10 },
      { header: 'User ID', value: v => v.id, text: true, width: 38 },
    ])
  }

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent'
  const labelCls = 'block text-xs font-bold text-gray-800 mb-1'

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">

          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <UserCircle className="w-5 h-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{tSb('visitors')}</h1>
                  <p className="text-xs text-gray-500">
                    {tc('totalShown', { total: visitors.length, shown: sorted.length })}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadXlsx}
                disabled={sorted.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                title={tc('downloadExcelTitle')}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{tc('downloadExcel', { count: sorted.length })}</span>
                <span className="sm:hidden">Excel ({sorted.length})</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={t('searchPlaceholder')}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Table */}
            <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${editingVisitor ? 'flex-1 min-w-0' : 'w-full'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {([
                        { label: t('colVisitor'), key: 'username' as SortKey },
                        { label: t('colEmail'), key: 'email' as SortKey },
                        { label: t('colPhone'), key: 'phone' as SortKey },
                        { label: t('colCity'), key: 'city' as SortKey },
                        { label: t('colJoined'), key: 'created_at' as SortKey },
                        { label: t('colStatus'), key: 'is_blocked' as SortKey },
                      ]).map(col => (
                        <th key={col.key} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={() => toggleSort(col.key)}
                            className="inline-flex items-center gap-1 hover:text-gray-900"
                          >
                            {col.label}
                            <SortIcon k={col.key} />
                          </button>
                        </th>
                      ))}
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{tc('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sorted.map(visitor => (
                      <tr
                        key={visitor.id}
                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${editingVisitor?.id === visitor.id ? 'bg-violet-50/50' : ''}`}
                        onClick={() => openEdit(visitor)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center shrink-0 overflow-hidden">
                              {visitor.avatar_url ? (
                                <img src={visitor.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <UserCircle className="w-4 h-4 text-violet-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {visitor.username || 'N/A'}
                                {visitor.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{visitor.public_id}</span>}
                              </p>
                              {(visitor.first_name || visitor.last_name) && (
                                <p className="text-xs text-gray-500 truncate">
                                  {[visitor.first_name, visitor.last_name].filter(Boolean).join(' ')}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate"><a href={`mailto:${visitor.email}`} className="hover:text-brand hover:underline">{visitor.email}</a></td>
                        <td className="px-4 py-3 text-xs text-gray-600">{visitor.phone || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{visitor.city || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(visitor.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {visitor.is_blocked ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <Ban className="w-3 h-3" /> {tc('blocked')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> {tc('active')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(visitor)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 inline-flex items-center gap-1"
                            >
                              <Pencil className="w-3 h-3" /> {tc('edit')}
                            </button>
                            <button onClick={() => handleBlock(visitor.id, visitor.is_blocked)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                visitor.is_blocked
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}>
                              {visitor.is_blocked ? tc('unblock') : tc('block')}
                            </button>
                            <button onClick={() => handleDelete(visitor)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 inline-flex items-center gap-1"
                              title={tc('delete')}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sorted.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-400">{t('noVisitorsFound')}</p>
                </div>
              )}
            </div>

            {/* Edit Panel — slide-in sidebar on desktop, full-screen modal on mobile */}
            {editingVisitor && editForm && (
              <>
                <div
                  className="lg:hidden fixed inset-0 bg-black/40 z-40"
                  onClick={closeEdit}
                />
                <div className="fixed lg:static inset-x-0 bottom-0 lg:inset-auto z-50 lg:z-auto w-full lg:w-[380px] shrink-0 bg-white border border-gray-200 rounded-t-2xl lg:rounded-lg overflow-y-auto max-h-[85vh] lg:max-h-[calc(100vh-160px)] lg:sticky lg:top-6 shadow-2xl lg:shadow-none">
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center overflow-hidden shrink-0">
                        {editingVisitor.avatar_url ? (
                          <img src={editingVisitor.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserCircle className="w-5 h-5 text-violet-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{t('editVisitor')}</p>
                        <a href={`mailto:${editingVisitor.email}`} className="text-xs text-gray-500 hover:text-brand hover:underline">{editingVisitor.email}</a>
                      </div>
                    </div>
                    <button onClick={closeEdit} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {editError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-800">{editError}</p>
                    </div>
                  )}
                  {editSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-emerald-800">{editSuccess}</p>
                    </div>
                  )}

                  <div>
                    <label className={labelCls}>{t('username')} <span className="text-red-500">*</span></label>
                    <input type="text" value={editForm.username}
                      onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                      className={inputCls} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{t('firstName')}</label>
                      <input type="text" value={editForm.first_name}
                        onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{t('lastName')}</label>
                      <input type="text" value={editForm.last_name}
                        onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                        className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>{t('colPhone')}</label>
                    <input type="tel" value={editForm.phone}
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder={t('phonePlaceholder')}
                      className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>{t('dateOfBirth')}</label>
                    <DobInput value={editForm.date_of_birth}
                      onChange={iso => setEditForm({ ...editForm, date_of_birth: iso })}
                      className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>{t('city')}</label>
                    <input type="text" value={editForm.city}
                      onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder={t('cityPlaceholder')}
                      className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>{t('description')}</label>
                    <textarea value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      rows={3}
                      placeholder={t('descriptionPlaceholder')}
                      className={inputCls + ' resize-none'} />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer py-1">
                    <input type="checkbox" checked={editForm.is_blocked}
                      onChange={e => setEditForm({ ...editForm, is_blocked: e.target.checked })}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                    <span className="text-sm font-semibold text-red-700">{t('blockedToggle')}</span>
                  </label>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button onClick={handleSave} disabled={saving}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed">
                      <Save className="w-4 h-4" />
                      {saving ? tc('saving') : tc('save')}
                    </button>
                    <button onClick={() => handleDelete(editingVisitor)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">
                      <Trash2 className="w-4 h-4" />
                      {tc('delete')}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <AdminMessageButton
                      userId={editingVisitor.id}
                      recipientEmail={editingVisitor.email}
                      recipientName={editingVisitor.username || (editingVisitor.first_name || editingVisitor.last_name ? [editingVisitor.first_name, editingVisitor.last_name].filter(Boolean).join(' ') : null)}
                      defaultSubject={t('messageDefaultSubject')}
                      className="w-full justify-center"
                    />
                  </div>

                  <div className="text-[10px] text-gray-400 space-y-0.5 pt-1">
                    <p className="break-all">{t('id')}: {editingVisitor.id}</p>
                    <p>{t('joinedFull')}: {new Date(editingVisitor.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
