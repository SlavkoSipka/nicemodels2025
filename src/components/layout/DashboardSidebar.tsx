'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, User, BarChart3, Settings, LogOut, ExternalLink, Heart, MessageSquare, Building2, Users, Camera, Megaphone, Briefcase, Handshake } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'

interface DashboardSidebarProps {
  userRole?: 'model' | 'company' | 'user' | 'admin'
}

export default function DashboardSidebar({ userRole = 'model' }: DashboardSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [myProfileOpen, setMyProfileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Check if a path is active
  const isActive = (path: string) => pathname === path
  const isProfileActive = pathname?.startsWith(`/dashboard/${userRole}/profile`)

  // Auto-open dropdown if on a profile page
  useEffect(() => {
    if (isProfileActive) {
      setMyProfileOpen(true)
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
          <Link href="/" className="flex items-center">
            <Image
              src="/logo2.png"
              alt="nicemodels.ch"
              width={162}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <NotificationBell userRole={userRole} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {/* USER ROLE NAVIGATION */}
          {userRole === 'user' && (
            <>
              <Link
                href="/dashboard/user"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard/user')
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/user/profile"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard/user/profile')
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>

              <Link
                href="/dashboard/user/favorites"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard/user/favorites')
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span>Favorites</span>
              </Link>

              <Link
                href="/dashboard/user/comments"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard/user/comments')
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Comments</span>
              </Link>

              <Link
                href="/dashboard/user/settings"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive('/dashboard/user/settings')
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
            </>
          )}

          {/* MODEL ROLE NAVIGATION */}
          {userRole === 'model' && (
            <>
              <Link
                href="/dashboard/model"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard/model')
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

          <div>
            <button
              onClick={() => setMyProfileOpen(!myProfileOpen)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                isProfileActive
                  ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                  : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" />
                <span>My Profile</span>
              </div>
              <svg 
                className={`w-4 h-4 transition-transform ${myProfileOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {myProfileOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-pink-200 pl-4">
                <Link
                  href="/dashboard/model/profile/biography"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/biography')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Biography
                </Link>
                <Link
                  href="/dashboard/model/profile/about-me"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/about-me')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  About Me
                </Link>
                <Link
                  href="/dashboard/model/profile/languages"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/languages')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Languages
                </Link>
                <Link
                  href="/dashboard/model/profile/area"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/area')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Area / Address
                </Link>
                <Link
                  href="/dashboard/model/profile/services"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/services')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Services
                </Link>
                <Link
                  href="/dashboard/model/profile/working-hours"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/working-hours')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Working Hours
                </Link>
                <Link
                  href="/dashboard/model/profile/rates"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/rates')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Rates
                </Link>
                <Link
                  href="/dashboard/model/profile/contact-details"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/contact-details')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Contact Details
                </Link>
                <Link
                  href="/dashboard/model/profile/pictures-video"
                  className={`block py-2 px-3 text-sm rounded-md transition-all ${
                    isActive('/dashboard/model/profile/pictures-video')
                      ? 'bg-pink-100 text-pink-700 font-semibold'
                      : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
                  }`}
                >
                  Pictures / Video
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/dashboard/model/upload-story"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/model/upload-story')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>Upload Story</span>
          </Link>

          <Link
            href="/dashboard/model/verification"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive('/dashboard/model/verification')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Verification</span>
          </Link>

          <Link
            href="/dashboard/model/activate-ad"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/model/activate-ad')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <span>Activate Ad</span>
          </Link>

          <Link
            href="/dashboard/model/invites"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/model/invites')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Clubs & Invites</span>
          </Link>

          <Link
            href="/dashboard/model/comments"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/model/comments')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>Reviews</span>
          </Link>

          <Link
            href="/dashboard/model/collaborations"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/model/collaborations')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Handshake className="w-5 h-5" />
            <span>Collaborations</span>
          </Link>

          <Link
            href="/dashboard/model/buy-banner"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/model/buy-banner')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Buy Banner</span>
          </Link>

          <Link
            href="/dashboard/model/purchase-history"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              isActive('/dashboard/model/purchase-history')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>Purchase History</span>
          </Link>

          <Link
            href="/dashboard/model/statistics"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive('/dashboard/model/statistics')
                ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Statistics</span>
          </Link>

          <Link
            href="/dashboard/model/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive('/dashboard/model/settings')
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
            </>
          )}

          {/* COMPANY ROLE NAVIGATION */}
          {userRole === 'company' && (
            <>
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
                  onClick={() => setMyProfileOpen(!myProfileOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
                    pathname?.startsWith('/dashboard/company/profile')
                      ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                      : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5" />
                    <span>Agency Profile</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 transition-transform ${myProfileOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {myProfileOpen && (
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
                href="/dashboard/company/activate-ad"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard/company/activate-ad')
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Activate Ads</span>
              </Link>

              <Link
                href="/dashboard/company/buy-banner"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard/company/buy-banner')
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Megaphone className="w-5 h-5" />
                <span>Buy Banner</span>
              </Link>

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

              <Link
                href="/dashboard/company/jobs-rent"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive('/dashboard/company/jobs-rent')
                    ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                    : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Briefcase className="w-5 h-5" />
                <span>Jobs / Rent</span>
              </Link>

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
            </>
          )}
        </div>
      </nav>

      {/* Go To Public Area */}
      <div className="p-4 border-t border-gray-100">
        {userRole === 'company' ? (
          <div className="space-y-2">
            <Link
              href="/clubs"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 rounded-lg transition-all shadow-sm group font-medium"
            >
              <span>View Clubs Page</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 rounded-lg transition-all shadow-sm group font-medium"
            >
              <span>View Girls Page</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 rounded-lg transition-all shadow-sm group font-medium"
          >
            <span>Go To Public Area</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </aside>
  )
}
