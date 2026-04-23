'use client'

import Link from 'next/link'
import DashboardSidebar from '@/components/layout/DashboardSidebar'
import SavedSearchForm from '@/components/saved-searches/SavedSearchForm'
import { ChevronLeft } from 'lucide-react'

export default function NewSavedSearchPage() {
  return (
    <>
      <DashboardSidebar userRole="user" />
      <div className="min-h-screen bg-gray-50 py-6 md:py-8 px-4 md:px-6 ml-0 md:ml-[280px]">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard/user/saved-searches"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-violet-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Saved searches
          </Link>
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">New saved search</h1>
            <p className="text-sm text-gray-500 mt-0.5">We will notify you in your inbox when a matching entry appears.</p>
          </div>
          <SavedSearchForm />
        </div>
      </div>
    </>
  )
}
