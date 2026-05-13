'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import SavedSearchForm, { type SavedSearchRow } from '@/components/saved-searches/SavedSearchForm'
import { ChevronLeft } from 'lucide-react'

export default function EditSavedSearchPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const t = useTranslations('dashboard.user.savedSearchesEdit')
  const [item, setItem] = useState<SavedSearchRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        router.push('/dashboard/user/saved-searches')
        return
      }
      setItem(data as SavedSearchRow)
      setLoading(false)
    }
    run()
  }, [params.id, router])

  if (loading || !item) return null

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8 px-4 md:px-6 ml-0 md:ml-[280px]">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard/user/saved-searches"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-violet-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> {t('backLink')}
          </Link>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
          </div>
          <SavedSearchForm existing={item} />
        </div>
    </div>
  )
}
