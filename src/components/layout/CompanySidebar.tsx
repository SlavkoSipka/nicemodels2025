'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, Building2, BarChart3, Settings, LogOut, ExternalLink, Users } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'

export default function CompanySidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [agencyProfileOpen, setAgencyProfileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Check if a path is active
  const isActive = (path: string) => pathname === path
  const isProfileActive = pathname?.startsWith('/dashboard/company/profile')

  // Auto-open dropdown if on a profile page
  useEffect(() => {
    if (isProfileActive) {
      setAgencyProfileOpen(true)
    }
  }, [isProfileActive])

  return (
    <aside 
      className="w-[280px] bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col shadow-sm z-50"
      style={{ willChange: 'auto', containIntrinsicSize: '280px 100vh' }}
    >
      {/* Logo & Notifications */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <Link href="/" className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight">
              <span className="text-gray-900">nice</span>
              <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
                models
              </span>
              <span className="text-pink-500 text-lg">.ch</span>
            </h1>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold mt-0.5">
              The Erotic Portal
            </span>
          </Link>
          <NotificationBell userRole="company" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/company"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/company')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>

          <div>
            <button
              onClick={() => setAgencyProfileOpen(!agencyProfileOpen)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                isProfileActive
                  ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                  : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5" />
                <span>Agency Profile</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${agencyProfileOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {agencyProfileOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-pink-200 pl-4">
                <Link
                  href="/dashboard/company/profile/basic-info"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/company/profile/basic-info')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Basic Info
                </Link>
                <Link
                  href="/dashboard/company/profile/contact-details"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/company/profile/contact-details')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Contact Details
                </Link>
                <Link
                  href="/dashboard/company/profile/working-hours"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/company/profile/working-hours')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Working Hours
                </Link>
                <Link
                  href="/dashboard/company/profile/club-photos"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/company/profile/club-photos')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Club Photos
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/dashboard/company/models"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/company/models')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Manage Models</span>
          </Link>

          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
            aria-disabled="true"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex items-center justify-between w-full">
              <span>Buy Banner</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/company/statistics"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive('/dashboard/company/statistics')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistics</span>
          </Link>

          <Link
            href="/dashboard/company/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive('/dashboard/company/settings')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Go To Public Area */}
      <div className="p-4 border-t border-gray-100">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 rounded-lg transition-all shadow-sm group font-medium"
        >
          <span>Go To Public Area</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>
      </div>
    </aside>
  )
}
