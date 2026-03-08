'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Building2, Image, Film, UserX,
  ShieldCheck, MessageSquare, Home, LogOut, ChevronRight, AlertCircle, Megaphone
} from 'lucide-react'

interface StatCard {
  label: string
  value: number
  icon: React.ReactNode
  href: string
  accent: string
  urgent?: boolean
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const [stats, setStats] = useState({
    totalModels: 0, totalClubs: 0, pendingPhotos: 0,
    pendingVideos: 0, blockedUsers: 0, pendingVerifications: 0, pendingComments: 0,
    pendingBanners: 0,
  })

  useEffect(() => {
    const load = async () => {
      const [models, clubs, photos, videos, blocked, verifications, comments, banners] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'model'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'company'),
        supabase.from('model_photos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
        supabase.from('model_videos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_blocked', true),
        supabase.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('model_comments').select('id', { count: 'exact', head: true }),
        supabase.from('banners').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      setStats({
        totalModels: models.count || 0, totalClubs: clubs.count || 0,
        pendingPhotos: photos.count || 0, pendingVideos: videos.count || 0,
        blockedUsers: blocked.count || 0, pendingVerifications: verifications.count || 0,
        pendingComments: comments.count || 0,
        pendingBanners: banners.count || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const cards: StatCard[] = [
    { label: 'Total Models', value: stats.totalModels, icon: <Users className="w-4 h-4" />, href: '/dashboard/admin/models', accent: 'text-brand bg-brand/10' },
    { label: 'Total Clubs', value: stats.totalClubs, icon: <Building2 className="w-4 h-4" />, href: '/dashboard/admin/clubs', accent: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Photos', value: stats.pendingPhotos, icon: <Image className="w-4 h-4" />, href: '/dashboard/admin/review-media', accent: 'text-amber-600 bg-amber-50', urgent: stats.pendingPhotos > 0 },
    { label: 'Pending Videos', value: stats.pendingVideos, icon: <Film className="w-4 h-4" />, href: '/dashboard/admin/review-media', accent: 'text-purple-600 bg-purple-50', urgent: stats.pendingVideos > 0 },
    { label: 'Blocked Users', value: stats.blockedUsers, icon: <UserX className="w-4 h-4" />, href: '/dashboard/admin/blocked', accent: 'text-red-600 bg-red-50' },
    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: <ShieldCheck className="w-4 h-4" />, href: '/dashboard/admin/verification', accent: 'text-emerald-600 bg-emerald-50', urgent: stats.pendingVerifications > 0 },
    { label: 'Total Comments', value: stats.pendingComments, icon: <MessageSquare className="w-4 h-4" />, href: '/dashboard/admin/comments', accent: 'text-orange-600 bg-orange-50' },
    { label: 'Pending Banners', value: stats.pendingBanners, icon: <Megaphone className="w-4 h-4" />, href: '/dashboard/admin/banners', accent: 'text-purple-600 bg-purple-50', urgent: stats.pendingBanners > 0 },
  ]

  const navItems = [
    { label: 'Manage Models', sub: `${stats.totalModels} registered`, icon: <Users className="w-4 h-4 text-brand" />, href: '/dashboard/admin/models' },
    { label: 'Manage Clubs', sub: `${stats.totalClubs} registered`, icon: <Building2 className="w-4 h-4 text-blue-600" />, href: '/dashboard/admin/clubs' },
    { label: 'Review Media', sub: `${stats.pendingPhotos + stats.pendingVideos} pending`, icon: <Image className="w-4 h-4 text-amber-600" />, href: '/dashboard/admin/review-media' },
    { label: 'Blocked Users', sub: `${stats.blockedUsers} blocked`, icon: <UserX className="w-4 h-4 text-red-600" />, href: '/dashboard/admin/blocked' },
    { label: 'Verifications', sub: `${stats.pendingVerifications} pending`, icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />, href: '/dashboard/admin/verification' },
    { label: 'Manage Comments', sub: `${stats.pendingComments} total`, icon: <MessageSquare className="w-4 h-4 text-orange-600" />, href: '/dashboard/admin/comments' },
    { label: 'Manage Banners', sub: `${stats.pendingBanners} pending`, icon: <Megaphone className="w-4 h-4 text-purple-600" />, href: '/dashboard/admin/banners' },
  ]

  const totalPending = stats.pendingPhotos + stats.pendingVideos + stats.pendingVerifications

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Platform management & content moderation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Home className="w-3.5 h-3.5" /> Home
              </Link>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          </div>

          {/* Urgent notice */}
          {totalPending > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-bold">{totalPending} items</span> require your attention &mdash;
                {stats.pendingPhotos + stats.pendingVideos > 0 && ` ${stats.pendingPhotos + stats.pendingVideos} media,`}
                {stats.pendingVerifications > 0 && ` ${stats.pendingVerifications} verifications`}
              </p>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {cards.map(card => (
              <Link key={card.label} href={card.href}
                className="bg-white border border-gray-200 rounded-lg p-3.5 hover:border-gray-300 hover:shadow-sm transition-all group relative">
                {card.urgent && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
                <div className={`w-7 h-7 rounded-md ${card.accent} flex items-center justify-center mb-2`}>
                  {card.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </Link>
            ))}
          </div>

          {/* Navigation */}
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            <div className="px-4 py-3">
              <p className="text-sm font-bold text-gray-800">Quick Navigation</p>
            </div>
            {navItems.map(item => (
              <Link key={item.label} href={item.href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center group-hover:bg-gray-100">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-brand transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand transition-colors" />
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
