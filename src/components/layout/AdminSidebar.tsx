'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, BarChart3, Globe, Users, Building2, Briefcase,
  Megaphone, DollarSign, UserCircle, Image as ImageIcon, ShieldCheck,
  Flag, UserX, MessageSquare, Activity, Home, LogOut, ChevronLeft,
  ChevronDown, ChevronRight, Trash2,
} from 'lucide-react'

export interface AdminSidebarCounts {
  verifications?: number
  reports?: number
  media?: number
  banners?: number
  comments?: number
  blocked?: number
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badgeKey?: keyof AdminSidebarCounts
  urgent?: boolean
}

interface NavGroup {
  id: string
  label: string
  items: NavItem[]
}

const GROUPS: NavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    id: 'statistics',
    label: 'Statistics',
    items: [
      { label: 'Site Traffic', href: '/dashboard/admin/statistics/traffic', icon: <Globe className="w-4 h-4" /> },
      { label: 'Models', href: '/dashboard/admin/statistics/models', icon: <Users className="w-4 h-4" /> },
      { label: 'Clubs', href: '/dashboard/admin/statistics/clubs', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Listings', href: '/dashboard/admin/statistics/listings', icon: <Briefcase className="w-4 h-4" /> },
      { label: 'Banners', href: '/dashboard/admin/statistics/banners', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Revenue', href: '/dashboard/admin/statistics/revenue', icon: <DollarSign className="w-4 h-4" /> },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { label: 'Models', href: '/dashboard/admin/models', icon: <Users className="w-4 h-4" /> },
      { label: 'Clubs', href: '/dashboard/admin/clubs', icon: <Building2 className="w-4 h-4" /> },
      { label: 'Visitors', href: '/dashboard/admin/users', icon: <UserCircle className="w-4 h-4" /> },
      { label: 'Jobs & Rents', href: '/dashboard/admin/jobs-rents', icon: <Briefcase className="w-4 h-4" /> },
      { label: 'Comments', href: '/dashboard/admin/comments', icon: <MessageSquare className="w-4 h-4" />, badgeKey: 'comments' },
      { label: 'Banners', href: '/dashboard/admin/banners', icon: <Megaphone className="w-4 h-4" />, badgeKey: 'banners', urgent: true },
    ],
  },
  {
    id: 'moderation',
    label: 'Moderation',
    items: [
      { label: 'Verification', href: '/dashboard/admin/verification', icon: <ShieldCheck className="w-4 h-4" />, badgeKey: 'verifications', urgent: true },
      { label: 'Media Review', href: '/dashboard/admin/review-media', icon: <ImageIcon className="w-4 h-4" />, badgeKey: 'media', urgent: true },
      { label: 'Reports', href: '/dashboard/admin/reports', icon: <Flag className="w-4 h-4" />, badgeKey: 'reports', urgent: true },
      { label: 'Blocked', href: '/dashboard/admin/blocked', icon: <UserX className="w-4 h-4" />, badgeKey: 'blocked' },
      { label: 'Deleted', href: '/dashboard/admin/deleted', icon: <Trash2 className="w-4 h-4" /> },
    ],
  },
  {
    id: 'activity',
    label: 'Activity',
    items: [
      { label: 'Latest Actions', href: '/latest-actions', icon: <Activity className="w-4 h-4" /> },
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
  const [collapsed, setCollapsed] = useState(false)
  const [openMobile, setOpenMobile] = useState(false)

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
              <p className="text-sm font-bold text-gray-900 leading-none">Admin</p>
              <p className="text-[10px] text-gray-400 mt-0.5">NiceModels</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="hidden md:inline-flex w-7 h-7 items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          title={collapsed ? 'Expand' : 'Collapse'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {GROUPS.map(group => (
          <div key={group.id}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = isActive(pathname, item.href)
                const count = item.badgeKey ? counts?.[item.badgeKey] ?? 0 : 0
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand/10 text-brand'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={active ? 'text-brand' : 'text-gray-400'}>{item.icon}</span>
                      {!collapsed && <span>{item.label}</span>}
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
        <Link
          href="/"
          className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
          title={collapsed ? 'Home' : undefined}
        >
          <Home className="w-4 h-4 text-gray-400" />
          {!collapsed && <span>Home</span>}
        </Link>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile header trigger */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center">
            <LayoutDashboard className="w-3.5 h-3.5 text-brand" />
          </div>
          <span className="text-sm font-bold text-gray-900">Admin</span>
        </div>
        <button
          onClick={() => setOpenMobile(v => !v)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 rounded-md"
        >
          Menu {openMobile ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
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
          <aside className="md:hidden fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-gray-200 flex flex-col">
            {Inner}
          </aside>
        </>
      )}
    </>
  )
}
