import SearchFilters from '@/components/search/SearchFilters'
import ProfileGrid from '@/components/search/ProfileGrid'
import { Suspense } from 'react'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50/30 to-white py-8">
      <div className="mx-auto px-4 max-w-full">
        <h1 className="text-5xl font-bold mb-8 animate-fade-in">
          Find Your Perfect <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Companion</span>
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

