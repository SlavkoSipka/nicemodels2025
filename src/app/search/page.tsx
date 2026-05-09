import type { Metadata } from 'next'
import SearchFilters from '@/components/search/SearchFilters'
import ProfileGrid from '@/components/search/ProfileGrid'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Escort-Models suchen – Schweiz',
  description:
    'Finde dein perfektes Escort-Model in der Schweiz. Filtern nach Stadt, Alter, Services und mehr auf NiceModels.ch.',
  alternates: { canonical: 'https://www.nicemodels.ch/search' },
}

export default async function SearchPage() {
  const t = await getTranslations('search.page')
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50/30 to-white py-8">
      <div className="mx-auto px-4 max-w-full">
        <h1 className="text-5xl font-bold mb-8 animate-fade-in">
          {t('titlePart1')}<span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{t('titleHighlight')}</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <SearchFilters />
          </aside>

          {/* Results Grid */}
          <main className="lg:col-span-3">
            <Suspense fallback={<div>Loading...</div>}>
              <ProfileGrid />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}

