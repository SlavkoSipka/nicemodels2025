'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, Building2, Image, Video, UserCheck, UserX, LogOut, Home } from 'lucide-react'

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
    totalModels: 0,
    totalClubs: 0,
    pendingPhotos: 0,
    pendingVideos: 0,
    blockedUsers: 0,
    pendingVerifications: 0,
  })

  useEffect(() => {
    const checkAdminAndLoadStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Load statistics
      const [modelsCount, clubsCount, photosCount, videosCount, blockedCount, verificationsCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'model'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'company'),
        supabase.from('model_photos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
        supabase.from('model_videos').select('id', { count: 'exact', head: true }).or('is_approved.is.null,is_approved.eq.false'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_blocked', true),
        supabase.from('verifications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      setStats({
        totalModels: modelsCount.count || 0,
        totalClubs: clubsCount.count || 0,
        pendingPhotos: photosCount.count || 0,
        pendingVideos: videosCount.count || 0,
        blockedUsers: blockedCount.count || 0,
        pendingVerifications: verificationsCount.count || 0,
      })

      setLoading(false)
    }

    checkAdminAndLoadStats()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, content, and platform settings</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-red-600 bg-red-50 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Models */}
          <Link href="/dashboard/admin/models">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Models</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalModels}</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </div>
          </Link>

          {/* Total Clubs */}
          <Link href="/dashboard/admin/clubs">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Clubs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalClubs}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </Link>

          {/* Unapproved Photos */}
          <Link href="/dashboard/admin/review-media">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unapproved Photos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingPhotos}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Image className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </Link>

          {/* Unapproved Videos */}
          <Link href="/dashboard/admin/review-media">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unapproved Videos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingVideos}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </Link>

          {/* Blocked Users */}
          <Link href="/dashboard/admin/blocked">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Blocked Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.blockedUsers}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </Link>

          {/* Pending Verifications */}
          <Link href="/dashboard/admin/verification">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Verifications</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/admin/models">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all">
                Manage Models
              </button>
            </Link>
            <Link href="/dashboard/admin/clubs">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all">
                Manage Clubs
              </button>
            </Link>
            <Link href="/dashboard/admin/review-media">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all">
                Review Media
              </button>
            </Link>
            <Link href="/dashboard/admin/blocked">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all">
                Blocked Users
              </button>
            </Link>
            <Link href="/dashboard/admin/verification">
              <button className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all">
                Verifications
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
