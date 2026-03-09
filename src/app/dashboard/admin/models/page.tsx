'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Ban, CheckCircle, Search, User, Users, Camera, Pencil } from 'lucide-react'
import PhotoGalleryModal from '@/components/admin/PhotoGalleryModal'

interface Model {
  id: string
  email: string
  username: string
  created_at: string
  is_blocked: boolean
  onboarding_completed: boolean
  is_verified: boolean
  model_details?: { showname: string; city: string }
  photoUrl?: string | null
}

export default function AdminModelsPage() {
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<Model[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  useEffect(() => { loadModels() }, [])

  const loadModels = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select(`id, email, username, created_at, is_blocked, onboarding_completed, is_verified,
        model_details!model_details_model_id_fkey (showname, city)`)
      .eq('role', 'model')
      .order('created_at', { ascending: false })

    if (error) { setLoading(false); return }

    const modelIds = (data || []).map((m: any) => m.id)
    const { data: photos } = await supabase
      .from('model_photos')
      .select('model_id, file_path')
      .in('model_id', modelIds)
      .eq('is_approved', true)
      .order('uploaded_at', { ascending: false })

    const photoMap: Record<string, string> = {}
    const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    for (const p of photos || []) {
      if (!photoMap[p.model_id] && p.file_path) {
        photoMap[p.model_id] = `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`
      }
    }

    setModels((data || []).map((m: any) => ({
      ...m,
      model_details: Array.isArray(m.model_details) ? m.model_details[0] : m.model_details,
      photoUrl: photoMap[m.id] || null,
    })))
    setLoading(false)
  }

  const handleBlock = async (userId: string, blocked: boolean) => {
    if (!confirm(`${blocked ? 'Unblock' : 'Block'} this user?`)) return
    const supabase = createClient()
    await supabase.from('profiles').update({
      is_blocked: !blocked,
      blocked_at: !blocked ? new Date().toISOString() : null,
    }).eq('id', userId)
    loadModels()
  }

  const filtered = models.filter(m =>
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.model_details?.showname?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Models Management</h1>
                  <p className="text-xs text-gray-500">{models.length} total models</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by email, username, or showname..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent" />
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['Model', 'Email', 'City', 'Joined', 'Verified', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(model => (
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
                            </p>
                            <p className="text-xs text-gray-400 truncate">@{model.username || 'no-username'}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{model.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{model.model_details?.city || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(model.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {model.is_verified ? (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <CheckCircle className="w-3 h-3" /> Yes
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {model.is_blocked ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <Ban className="w-3 h-3" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                          {!model.onboarding_completed && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">Incomplete</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/dashboard/admin/models/${model.id}`}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-brand/10 text-brand hover:bg-brand/20 transition-colors flex items-center gap-1">
                            <Pencil className="w-3 h-3" /> Edit
                          </Link>
                          <button onClick={() => { setSelectedModel(model); setShowPhotoModal(true) }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1">
                            <Camera className="w-3 h-3" /> Photos
                          </button>
                          <button onClick={() => handleBlock(model.id, model.is_blocked)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                              model.is_blocked
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}>
                            {model.is_blocked ? 'Unblock' : 'Block'}
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
                <p className="text-sm text-gray-400">No models found</p>
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
