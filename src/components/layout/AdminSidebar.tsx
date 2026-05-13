'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import LanguageSwitcher from '@/components/admin/LanguageSwitcher'
import {
  LayoutDashboard, BarChart3, Globe, Users, Building2, Briefcase,
  Megaphone, DollarSign, UserCircle, Image as ImageIcon, ShieldCheck,
  Flag, UserX, MessageSquare, Activity, Home, LogOut, ChevronLeft,
  Trash2, Menu, X,
} from 'lucide-react'

// Maps an admin pathname to a label key inside `admin.sidebar`.
// Used by the mobile top bar to show the active page name.
const PATH_TO_LABEL: Array<{ match: (p: string) => boolean; key: string }> = [
  { match: p => p === '/dashboard/admin', key: 'dashboard' },
  { match: p => p.startsWith('/dashboard/admin/statistics/traffic'), key: 'siteTraffic' },
  { match: p => p.startsWith('/dashboard/admin/statistics/models'), key: 'models' },
  { match: p => p.startsWith('/dashboard/admin/statistics/clubs'), key: 'clubs' },
  { match: p => p.startsWith('/dashboard/admin/statistics/listings'), key: 'listings' },
  { match: p => p.startsWith('/dashboard/admin/statistics/banners'), key: 'banners' },
  { match: p => p.startsWith('/dashboard/admin/statistics/revenue'), key: 'revenue' },
  { match: p => p.startsWith('/dashboard/admin/models'), key: 'models' },
  { match: p => p.startsWith('/dashboard/admin/clubs'), key: 'clubs' },
  { match: p => p.startsWith('/dashboard/admin/users'), key: 'visitors' },
  { match: p => p.startsWith('/dashboard/admin/jobs-rents'), key: 'jobsRents' },
  { match: p => p.startsWith('/dashboard/admin/comments'), key: 'comments' },
  { match: p => p.startsWith('/dashboard/admin/banners'), key: 'banners' },
  { match: p => p.startsWith('/dashboard/admin/verification'), key: 'verification' },
  { match: p => p.startsWith('/dashboard/admin/review-media'), key: 'mediaReview' },
  { match: p => p.startsWith('/dashboard/admin/reports'), key: 'reports' },
  { match: p => p.startsWith('/dashboard/admin/blocked'), key: 'blocked' },
  { match: p => p.startsWith('/dashboard/admin/deleted'), key: 'deleted' },
  { match: p => p.startsWith('/dashboard/admin/discussions'), key: 'comments' },
]

export interface AdminSidebarCounts {
  verifications?: number
  reports?: number
  media?: number
  banners?: number
  comments?: number
  blocked?: number
}

interface NavItem {
  labelKey: string
  href: string
  icon: React.ReactNode
  badgeKey?: keyof AdminSidebarCounts
  urgent?: boolean
}

interface NavGroup {
  id: string
  labelKey: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    id: 'overview',
    labelKey: 'overview',
    items: [
      { labelKey: 'dashboard', href: '/dashboard/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    id: 'statistics',
    labelKey: 'statistics',
    items: [
      { labelKey: 'siteTraffic', href: '/dashboard/admin/statistics/traffic', icon: <Globe className="w-4 h-4" /> },
      { labelKey: 'models', href: '/dashboard/admin/statistics/models', icon: <Users className="w-4 h-4" /> },
      { labelKey: 'clubs', href: '/dashboard/admin/statistics/clubs', icon: <Building2 className="w-4 h-4" /> },
      { labelKey: 'listings', href: '/dashboard/admin/statistics/listings', icon: <Briefcase className="w-4 h-4" /> },
      { labelKey: 'banners', href: '/dashboard/admin/statistics/banners', icon: <Megaphone className="w-4 h-4" /> },
      { labelKey: 'revenue', href: '/dashboard/admin/statistics/revenue', icon: <DollarSign className="w-4 h-4" /> },
    ],
  },
  {
    id: 'content',
    labelKey: 'content',
    items: [
      { labelKey: 'models', href: '/dashboard/admin/models', icon: <Users className="w-4 h-4" /> },
      { labelKey: 'clubs', href: '/dashboard/admin/clubs', icon: <Building2 className="w-4 h-4" /> },
      { labelKey: 'visitors', href: '/dashboard/admin/users', icon: <UserCircle className="w-4 h-4" /> },
      { labelKey: 'jobsRents', href: '/dashboard/admin/jobs-rents', icon: <Briefcase className="w-4 h-4" /> },
      { labelKey: 'comments', href: '/dashboard/admin/comments', icon: <MessageSquare className="w-4 h-4" />, badgeKey: 'comments' },
      { labelKey: 'banners', href: '/dashboard/admin/banners', icon: <Megaphone className="w-4 h-4" />, badgeKey: 'banners', urgent: true },
    ],
  },
  {
    id: 'moderation',
    labelKey: 'moderation',
    items: [
      { labelKey: 'verification', href: '/dashboard/admin/verification', icon: <ShieldCheck className="w-4 h-4" />, badgeKey: 'verifications', urgent: true },
      { labelKey: 'mediaReview', href: '/dashboard/admin/review-media', icon: <ImageIcon className="w-4 h-4" />, badgeKey: 'media', urgent: true },
      { labelKey: 'reports', href: '/dashboard/admin/reports', icon: <Flag className="w-4 h-4" />, badgeKey: 'reports', urgent: true },
      { labelKey: 'blocked', href: '/dashboard/admin/blocked', icon: <UserX className="w-4 h-4" />, badgeKey: 'blocked' },
      { labelKey: 'deleted', href: '/dashboard/admin/deleted', icon: <Trash2 className="w-4 h-4" /> },
    ],
  },
  {
    id: 'activity',
    labelKey: 'activity',
    items: [
      { labelKey: 'latestActions', href: '/latest-actions', icon: <Activity className="w-4 h-4" /> },
    ],
  },
]

function isActive(pathname: string, href: string) {
  if (href === '/dashboard/admin') return pathname === '/dashboard/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function AdminSidebar({ counts }: { counts?: AdminSidebarCounts }) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const supabase = createClient()
  const t = useTranslations('admin.sidebar')
  const [collapsed, setCollapsed] = useState(false)
  const [openMobile, setOpenMobile] = useState(false)

  const activeLabelKey = PATH_TO_LABEL.find(m => m.match(pathname))?.key ?? 'title'
  const activeLabel = t(activeLabelKey)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const widthCls = collapsed ? 'w-[68px]' : 'w-[232px]'

  const Inner = (
    <>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3.5 border-b border-gray-100`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-brand" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">{t('title')}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">NiceModels</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="hidden md:inline-flex w-7 h-7 items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          title={collapsed ? t('expand') : t('collapse')}
          aria-label={collapsed ? t('expand') : t('collapse')}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {GROUPS.map(group => (
          <div key={group.id}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {t(group.labelKey)}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(pathname, item.href)
                const count = item.badgeKey ? counts?.[item.badgeKey] ?? 0 : 0
                const label = t(item.labelKey)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand/10 text-brand'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={collapsed ? label : undefined}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={active ? 'text-brand' : 'text-gray-400'}>{item.icon}</span>
                      {!collapsed && <span>{label}</span>}
                    </span>
                    {!collapsed && count > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                          item.urgent ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                    {collapsed && count > 0 && (
                      <span className="absolute ml-5 -mt-5 w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-2 space-y-1">
        <div className={collapsed ? 'px-1 py-1' : 'px-1.5 py-1'}>
          <LanguageSwitcher collapsed={collapsed} />
        </div>
        <Link
          href="/"
          className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
          title={collapsed ? t('home') : undefined}
        >
          <Home className="w-4 h-4 text-gray-400" />
          {!collapsed && <span>{t('home')}</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50`}
          title={collapsed ? t('logout') : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header trigger – fixed full-width so it does not depend on the
          parent flex layout for sizing. */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-3 h-12">
        <button
          onClick={() => setOpenMobile(v => !v)}
          className="inline-flex items-center justify-center w-10 h-10 -ml-2 rounded-md text-gray-700 hover:bg-gray-100"
          aria-label={openMobile ? t('collapse') : t('menu')}
        >
          {openMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <div className="flex items-center gap-2 flex-1 justify-center px-2 min-w-0">
          <span className="text-sm font-bold text-gray-900 truncate">{activeLabel}</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center w-10 h-10 -mr-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          aria-label={t('home')}
        >
          <Home className="w-5 h-5" />
        </Link>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex sticky top-0 h-screen ${widthCls} shrink-0 flex-col bg-white border-r border-gray-200 transition-[width] duration-200`}
      >
        {Inner}
      </aside>

      {/* Mobile drawer */}
      {openMobile && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setOpenMobile(false)}
          />
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white border-r border-gray-200 flex flex-col">
            <div className="flex items-center justify-end px-2 py-2 border-b border-gray-100">
              <button
                onClick={() => setOpenMobile(false)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                aria-label={t('collapse')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col min-h-0" onClick={() => setOpenMobile(false)}>
              {Inner}
            </div>
          </aside>
        </>
      )}
    </>
  )
}
