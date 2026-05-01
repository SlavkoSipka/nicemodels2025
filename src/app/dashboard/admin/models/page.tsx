'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Ban, CheckCircle, Search, User, Users, Camera, Pencil, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import PhotoGalleryModal from '@/components/admin/PhotoGalleryModal'
import { downloadXlsx, fmtDateTime } from '@/lib/exportXlsx'

interface Model {
  id: string
  email: string
  username: string
  public_id?: number | null
  created_at: string
  is_blocked: boolean
  onboarding_completed: boolean
  is_verified: boolean
  model_details?: { showname: string; city: string }
  photoUrl?: string | null
  contact_phone?: string | null
  contact_email?: string | null
}

type SortKey = 'showname' | 'email' | 'city' | 'created_at' | 'is_verified' | 'is_blocked'

export default function AdminModelsPage() {
  const t = useTranslations('admin.models')
  const tc = useTranslations('admin.common')
  const tSb = useTranslations('admin.sidebar')
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<Model[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => { loadModels() }, [])

  const loadModels = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select(`id, email, username, public_id, created_at, is_blocked, onboarding_completed, is_verified,
        model_details!model_details_model_id_fkey (showname, city)`)
      .eq('role', 'model')
      .order('created_at', { ascending: false })

    if (error) { setLoading(false); return }

    const modelIds = (data || []).map((m: any) => m.id)
    const [{ data: photos }, contactsRes] = await Promise.all([
      supabase
        .from('model_photos')
        .select('model_id, file_path')
        .in('model_id', modelIds)
        .eq('is_approved', true)
        .order('uploaded_at', { ascending: false }),
      fetch('/api/admin/contacts?role=model', { cache: 'no-store' })
        .then(r => r.ok ? r.json() : { contacts: [] })
        .catch(() => ({ contacts: [] })),
    ])
    const contacts = contactsRes.contacts as Array<{ model_id: string; country_code: string | null; phone_number: string | null }>

    const photoMap: Record<string, string> = {}
    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    for (const p of photos || []) {
      if (!photoMap[p.model_id] && p.file_path) {
        photoMap[p.model_id] = `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`
      }
    }

    const contactMap: Record<string, { phone: string | null }> = {}
    for (const c of contacts || []) {
      const phone = c.phone_number ? `${c.country_code || ''} ${c.phone_number}`.trim() : null
      contactMap[c.model_id] = { phone }
    }

    setModels((data || []).map((m: any) => ({
      ...m,
      model_details: Array.isArray(m.model_details) ? m.model_details[0] : m.model_details,
      photoUrl: photoMap[m.id] || null,
      contact_phone: contactMap[m.id]?.phone || null,
      contact_email: null,
    })))
    setLoading(false)
  }

  const handleBlock = async (userId: string, blocked: boolean) => {
    if (!confirm(blocked ? t('confirmUnblock') : t('confirmBlock'))) return
    const res = await fetch('/api/admin/block-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, block: !blocked }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || tc('failedToUpdate'))
      return
    }
    loadModels()
  }

  const handleDelete = async (model: Model) => {
    const name = model.model_details?.showname || model.username || model.email
    const confirmation = prompt(`${t('deleteConfirmPrefix')} "${name}".\n${t('deleteWarning')}`)
    if (confirmation !== 'DELETE') return
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: model.id, reason: 'Deleted by admin' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || tc('failedToDelete'))
      }
      setModels(prev => prev.filter(m => m.id !== model.id))
    } catch (e: any) {
      alert(e.message || t('deleteFailed'))
    }
  }

  const filtered = models.filter(m => {
    const q = searchTerm.toLowerCase()
    if (!q) return true
    if (m.public_id && (`#${m.public_id}` === q || String(m.public_id) === q)) return true
    return m.email.toLowerCase().includes(q) ||
      m.username?.toLowerCase().includes(q) ||
      m.model_details?.showname?.toLowerCase().includes(q)
  })

  const sortValue = (m: Model, key: SortKey): string | number => {
    switch (key) {
      case 'showname': return (m.model_details?.showname || m.username || '').toLowerCase()
      case 'email': return (m.email || '').toLowerCase()
      case 'city': return (m.model_details?.city || '').toLowerCase()
      case 'created_at': return new Date(m.created_at || 0).getTime()
      case 'is_verified': return m.is_verified ? 1 : 0
      case 'is_blocked': return m.is_blocked ? 1 : 0
    }
  }

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    const va = sortValue(a, sortKey)
    const vb = sortValue(b, sortKey)
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
    return String(va).localeCompare(String(vb)) * dir
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir(key === 'created_at' ? 'desc' : 'asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 text-gray-300" />
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-gray-700" />
      : <ArrowDown className="w-3 h-3 text-gray-700" />
  }

  const handleDownloadXlsx = () => {
    downloadXlsx('nicemodels-models', sorted, [
      { header: 'Public ID', value: m => m.public_id ?? '', width: 10 },
      { header: 'Showname', value: m => m.model_details?.showname || '', width: 22 },
      { header: 'Username', value: m => m.username || '', width: 20 },
      { header: 'Account Email', value: m => m.email || '', width: 30 },
      { header: 'Contact Email', value: m => m.contact_email || '', width: 30 },
      { header: 'Phone', value: m => m.contact_phone || '', text: true, width: 22 },
      { header: 'City', value: m => m.model_details?.city || '', width: 18 },
      { header: 'Joined', value: m => fmtDateTime(m.created_at), text: true, width: 20 },
      { header: 'Verified', value: m => m.is_verified ? 'Yes' : 'No', width: 10 },
      { header: 'Onboarded', value: m => m.onboarding_completed ? 'Yes' : 'No', width: 12 },
      { header: 'Blocked', value: m => m.is_blocked ? 'Yes' : 'No', width: 10 },
      { header: 'User ID', value: m => m.id, text: true, width: 38 },
    ])
  }

  if (loading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-4 px-3 sm:py-6 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Header */}
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-brand" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{tSb('models')}</h1>
                  <p className="text-xs text-gray-500">{tc('totalShown', { total: models.length, shown: sorted.length })}</p>
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={t('searchPlaceholder')}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {([
                      { label: t('colModel'), key: 'showname' as SortKey },
                      { label: t('colEmail'), key: 'email' as SortKey },
                      { label: t('colCity'), key: 'city' as SortKey },
                      { label: t('colJoined'), key: 'created_at' as SortKey },
                      { label: t('colVerified'), key: 'is_verified' as SortKey },
                      { label: t('colStatus'), key: 'is_blocked' as SortKey },
                    ]).map(col => (
                      <th key={col.key} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <button onClick={() => toggleSort(col.key)} className="inline-flex items-center gap-1 hover:text-gray-900">
                          {col.label}
                          <SortIcon k={col.key} />
                        </button>
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map(model => (
                    <tr key={model.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/admin/models/${model.id}`}
                          className="flex items-center gap-2.5 group">
                          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {model.photoUrl ? (
                              <Image
                                src={model.photoUrl}
                                alt={model.model_details?.showname || model.username}
                                fill
                                sizes="32px"
                                className="object-cover object-top"
                              />
                            ) : (
                              <User className="w-4 h-4 text-brand" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand transition-colors">
                              {model.model_details?.showname || model.username || 'N/A'}
                              {model.public_id && <span className="ml-1.5 text-[10px] font-mono text-gray-400">#{model.public_id}</span>}
                            </p>
                            <p className="text-xs text-gray-400 truncate">@{model.username || t('noUsername')}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate"><a href={`mailto:${model.email}`} className="hover:text-brand hover:underline">{model.email}</a></td>
                      <td className="px-4 py-3 text-sm text-gray-700">{model.model_details?.city || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(model.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {model.is_verified ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <CheckCircle className="w-3 h-3" /> {tc('verified')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">{tc('no')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {model.is_blocked ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <Ban className="w-3 h-3" /> {tc('blocked')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> {tc('active')}
                            </span>
                          )}
                          {!model.onboarding_completed && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{tc('incomplete')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/dashboard/admin/models/${model.id}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-brand/10 text-brand hover:bg-brand/20 transition-colors flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> {tc('edit')}
                          </Link>
                          <button onClick={() => { setSelectedModel(model); setShowPhotoModal(true) }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1">
                            <Camera className="w-3 h-3" /> {t('photos')}
                          </button>
                          <button onClick={() => handleBlock(model.id, model.is_blocked)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                              model.is_blocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}>
                            {model.is_blocked ? tc('unblock') : tc('block')}
                          </button>
                          <button
                            onClick={() => handleDelete(model)}
                            className="p-1.5 text-xs font-semibold rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            title={tc('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
                <p className="text-sm text-gray-400">{t('noModelsFound')}</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {selectedModel && (
        <PhotoGalleryModal isOpen={showPhotoModal}
          onClose={() => { setShowPhotoModal(false); setSelectedModel(null) }}
          profileId={selectedModel.id}
          profileName={selectedModel.model_details?.showname || selectedModel.username || 'Model'}
          profileType="model" />
      )}
    </div>
  )
}
