'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Home, User, BarChart3, Settings, LogOut, ExternalLink, Heart, MessageSquare, Building2, Users, Camera, Megaphone, Briefcase, Handshake, Menu, X, ShieldCheck, Search as SearchIcon, Bell } from 'lucide-react'
import NotificationBell from '@/components/notifications/NotificationBell'

interface DashboardSidebarProps {
  userRole?: 'model' | 'company' | 'user' | 'admin'
}

export default function DashboardSidebar({ userRole = 'model' }: DashboardSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [myProfileOpen, setMyProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (path: string) => pathname === path
  const isProfileActive = pathname?.startsWith(`/dashboard/${userRole}/profile`)

  useEffect(() => {
    if (isProfileActive) {
      setMyProfileOpen(true)
    }
  }, [isProfileActive])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navLinkCls = (path: string, extra?: string) =>
    `flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg font-medium transition-all text-sm ${
      isActive(path)
        ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
        : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
    } ${extra || ''}`

  const subLinkCls = (path: string) =>
    `block py-1.5 px-2.5 md:py-2 md:px-3 text-[13px] md:text-sm rounded-md transition-all ${
      isActive(path)
        ? 'bg-pink-100 text-pink-700 font-semibold'
        : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50'
    }`

  const sidebarContent = (
    <>
      {/* Logo & Notifications */}
      <div className="p-4 md:p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1 md:mb-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.webp"
              alt="nicemodels.ch"
              width={162}
              height={48}
              className="h-8 md:h-10 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell userRole={userRole} />
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 md:py-6 px-3 md:px-4">
        <div className="space-y-0.5 md:space-y-1">
          {/* USER ROLE NAVIGATION */}
          {userRole === 'user' && (
            <>
              <Link href="/dashboard/user" className={navLinkCls('/dashboard/user')}>
                <Home className="w-5 h-5 shrink-0" />
                <span>Dashboard</span>
              </Link>
              <Link href="/dashboard/user/profile" className={navLinkCls('/dashboard/user/profile')}>
                <User className="w-5 h-5 shrink-0" />
                <span>Profile</span>
              </Link>
              <Link href="/dashboard/user/verification" className={navLinkCls('/dashboard/user/verification')}>
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <span>Verification</span>
              </Link>
              <Link href="/dashboard/user/favorites" className={navLinkCls('/dashboard/user/favorites')}>
                <Heart className="w-5 h-5 shrink-0" />
                <span>Favorites</span>
              </Link>
              <Link href="/dashboard/user/saved-searches" className={navLinkCls('/dashboard/user/saved-searches')}>
                <SearchIcon className="w-5 h-5 shrink-0" />
                <span>Saved Searches</span>
              </Link>
              <Link href="/dashboard/user/notifications" className={navLinkCls('/dashboard/user/notifications')}>
                <Bell className="w-5 h-5 shrink-0" />
                <span>Inbox</span>
              </Link>
              <Link href="/dashboard/user/comments" className={navLinkCls('/dashboard/user/comments')}>
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span>Comments</span>
              </Link>
              <Link
                href="/dashboard/user/jobs-rent"
                className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg font-semibold transition-all shadow-sm text-sm ${
                  isActive('/dashboard/user/jobs-rent')
                    ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-200'
                    : 'text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-md hover:shadow-emerald-100'
                }`}
              >
                <Briefcase className="w-5 h-5 shrink-0" />
                <span>Jobs / Rent</span>
                <span className="ml-auto text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">FREE</span>
              </Link>
              <Link href="/dashboard/user/settings" className={navLinkCls('/dashboard/user/settings')}>
                <Settings className="w-5 h-5 shrink-0" />
                <span>Settings</span>
              </Link>
              <div className="pt-3 mt-3 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm"
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
              <Link href="/dashboard/model" className={navLinkCls('/dashboard/model')}>
                <Home className="w-5 h-5 shrink-0" />
                <span>Dashboard</span>
              </Link>

              <div>
                <button
                  onClick={() => setMyProfileOpen(!myProfileOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg transition-all text-sm ${
                    isProfileActive
                      ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                      : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 shrink-0" />
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
                  <div className="ml-3 md:ml-4 mt-0.5 md:mt-1 space-y-0.5 md:space-y-1 border-l-2 border-pink-200 pl-3 md:pl-4">
                    <Link href="/dashboard/model/profile/biography" className={subLinkCls('/dashboard/model/profile/biography')}>Biography</Link>
                    <Link href="/dashboard/model/profile/about-me" className={subLinkCls('/dashboard/model/profile/about-me')}>About Me</Link>
                    <Link href="/dashboard/model/profile/contact-details" className={subLinkCls('/dashboard/model/profile/contact-details')}>Contact Details</Link>
                    <Link href="/dashboard/model/profile/area" className={subLinkCls('/dashboard/model/profile/area')}>Area / Address</Link>
                    <Link href="/dashboard/model/profile/pictures-video" className={subLinkCls('/dashboard/model/profile/pictures-video')}>Pictures / Video</Link>
                    <Link href="/dashboard/model/profile/languages" className={subLinkCls('/dashboard/model/profile/languages')}>Languages</Link>
                    <Link href="/dashboard/model/profile/services" className={subLinkCls('/dashboard/model/profile/services')}>Services</Link>
                    <Link href="/dashboard/model/profile/working-hours" className={subLinkCls('/dashboard/model/profile/working-hours')}>Working Hours</Link>
                    <Link href="/dashboard/model/profile/rates" className={subLinkCls('/dashboard/model/profile/rates')}>Rates</Link>
                  </div>
                )}
              </div>

              <Link
                href="/dashboard/model/activate-ad"
                className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg font-semibold transition-all shadow-sm text-sm ${
                  isActive('/dashboard/model/activate-ad')
                    ? 'text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-orange-200'
                    : 'text-white bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 hover:shadow-md hover:shadow-orange-100'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Activate Sedcard</span>
                <span className="ml-auto text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">FREE</span>
              </Link>

              <Link
                href="/dashboard/model/buy-banner"
                className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg font-semibold transition-all shadow-sm text-sm ${
                  isActive('/dashboard/model/buy-banner')
                    ? 'text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-200'
                    : 'text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 hover:shadow-md hover:shadow-violet-100'
                }`}
              >
                <Megaphone className="w-5 h-5 shrink-0" />
                <span>Buy Banner</span>
                <span className="ml-auto text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">PROMO</span>
              </Link>

              <Link href="/dashboard/model/upload-story" className={navLinkCls('/dashboard/model/upload-story')}>
                <Camera className="w-5 h-5 shrink-0" />
                <span>Upload Story</span>
              </Link>

              <Link href="/dashboard/model/verification" className={navLinkCls('/dashboard/model/verification')}>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verification</span>
              </Link>

              <Link href="/dashboard/model/invites" className={navLinkCls('/dashboard/model/invites')}>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Clubs & Invites</span>
              </Link>

              <Link href="/dashboard/model/comments" className={navLinkCls('/dashboard/model/comments')}>
                <MessageSquare className="w-5 h-5 shrink-0" />
                <span>Reviews</span>
              </Link>

              <Link href="/dashboard/model/collaborations" className={navLinkCls('/dashboard/model/collaborations')}>
                <Handshake className="w-5 h-5 shrink-0" />
                <span>Collaborations</span>
              </Link>

              <Link href="/dashboard/model/purchase-history" className={navLinkCls('/dashboard/model/purchase-history')}>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Purchase History</span>
              </Link>

              <Link href="/dashboard/model/statistics" className={navLinkCls('/dashboard/model/statistics')}>
                <BarChart3 className="w-5 h-5 shrink-0" />
                <span>Statistics</span>
              </Link>

              <Link href="/dashboard/model/settings" className={navLinkCls('/dashboard/model/settings')}>
                <Settings className="w-5 h-5 shrink-0" />
                <span>Settings</span>
              </Link>

              <div className="pt-3 mt-3 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm"
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
              <Link href="/dashboard/company" className={navLinkCls('/dashboard/company')}>
                <Home className="w-5 h-5 shrink-0" />
                <span>Dashboard</span>
              </Link>

              <div>
                <button
                  onClick={() => setMyProfileOpen(!myProfileOpen)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg transition-all text-sm ${
                    pathname?.startsWith('/dashboard/company/profile')
                      ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm'
                      : 'text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 shrink-0" />
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
                  <div className="ml-3 md:ml-4 mt-0.5 md:mt-1 space-y-0.5 md:space-y-1 border-l-2 border-pink-200 pl-3 md:pl-4">
                    <Link href="/dashboard/company/profile/basic-info" className={subLinkCls('/dashboard/company/profile/basic-info')}>Basic Info</Link>
                    <Link href="/dashboard/company/profile/working-hours" className={subLinkCls('/dashboard/company/profile/working-hours')}>Working Hours</Link>
                    <Link href="/dashboard/company/profile/club-photos" className={subLinkCls('/dashboard/company/profile/club-photos')}>Club Photos</Link>
                  </div>
                )}
              </div>

              <Link
                href="/dashboard/company/activate-ad"
                className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg font-semibold transition-all shadow-sm text-sm ${
                  isActive('/dashboard/company/activate-ad')
                    ? 'text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-orange-200'
                    : 'text-white bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 hover:shadow-md hover:shadow-orange-100'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Activate Sedcard</span>
                <span className="ml-auto text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">FREE</span>
              </Link>

              <Link
                href="/dashboard/company/buy-banner"
                className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg font-semibold transition-all shadow-sm text-sm ${
                  isActive('/dashboard/company/buy-banner')
                    ? 'text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-200'
                    : 'text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 hover:shadow-md hover:shadow-violet-100'
                }`}
              >
                <Megaphone className="w-5 h-5 shrink-0" />
                <span>Buy Banner</span>
                <span className="ml-auto text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">PROMO</span>
              </Link>

              <Link href="/dashboard/company/models" className={navLinkCls('/dashboard/company/models')}>
                <Users className="w-5 h-5 shrink-0" />
                <span>Manage Models</span>
              </Link>

              <Link
                href="/dashboard/company/jobs-rent"
                className={`flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 rounded-lg font-semibold transition-all shadow-sm text-sm ${
                  isActive('/dashboard/company/jobs-rent')
                    ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-200'
                    : 'text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-md hover:shadow-emerald-100'
                }`}
              >
                <Briefcase className="w-5 h-5 shrink-0" />
                <span>Jobs / Rent</span>
                <span className="ml-auto text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-bold tracking-wide">FREE</span>
              </Link>

              <Link href="/dashboard/company/statistics" className={navLinkCls('/dashboard/company/statistics')}>
                <BarChart3 className="w-5 h-5 shrink-0" />
                <span>Statistics</span>
              </Link>

              <Link href="/dashboard/company/settings" className={navLinkCls('/dashboard/company/settings')}>
                <Settings className="w-5 h-5 shrink-0" />
                <span>Settings</span>
              </Link>

              <div className="pt-3 mt-3 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 md:px-4 md:py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium text-sm"
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
      <div className="p-3 md:p-4 border-t border-gray-100">
        {userRole === 'company' ? (
          <div className="space-y-1.5 md:space-y-2">
            <Link
              href="/clubs"
              className="flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 rounded-lg transition-all shadow-sm group font-medium text-sm"
            >
              <span>View Clubs Page</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/models-page"
              className="flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 rounded-lg transition-all shadow-sm group font-medium text-sm"
            >
              <span>View Models Page</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-3 py-2.5 md:px-4 md:py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 rounded-lg transition-all shadow-sm group font-medium text-sm"
          >
            <span>Go To Public Area</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.webp"
            alt="nicemodels.ch"
            width={120}
            height={36}
            className="h-7 w-auto object-contain"
            priority
          />
        </Link>
        <NotificationBell userRole={userRole} />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - desktop: fixed, mobile: slide-out drawer */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm z-[70]
          w-[260px] md:w-[280px]
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ willChange: 'transform' }}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
