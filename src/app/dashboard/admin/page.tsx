'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Users, Building2, UserCircle, Briefcase, Megaphone, ShieldCheck, Flag,
  DollarSign, TrendingUp, AlertCircle, Eye, MessageSquare,
} from 'lucide-react'
import KpiCard from '@/components/admin/charts/KpiCard'
import ChartCard from '@/components/admin/charts/ChartCard'
import { shortDate } from '@/lib/adminUtils'

const StatsAreaChart = dynamic(() => import('@/components/admin/charts/StatsAreaChart'), { ssr: false })
const StatsBarChart = dynamic(() => import('@/components/admin/charts/StatsBarChart'), { ssr: false })
const StatsDonutChart = dynamic(() => import('@/components/admin/charts/StatsDonutChart'), { ssr: false })

interface Overview {
  kpis: {
    totalModels: number
    totalClubs: number
    totalVisitors: number
    totalUsers: number
    activeListings: number
    activeBanners: number
    pendingVerifications: number
    pendingReports: number
    pendingMedia: number
    pendingComments: number
    revenueAllTime: number
    revenue30d: number
    pageViews30d: number
    signups30d: number
  }
  trafficSeries: { date: string; views: number }[]
  signupSeries: { date: string; models: number; clubs: number; users: number }[]
  roleCounts: Record<string, number>
  topModels: { id: string; name: string; views: number }[]
  siteActions: any[]
}

function money(n: number) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 }).format(n || 0)
}

export default function AdminOverviewPage() {
  const t = useTranslations('admin.overview')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Overview | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats/overview')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="p-3 sm:p-6 lg:p-8">
        <div className="h-8 w-52 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  const { kpis, trafficSeries, signupSeries, roleCounts, topModels, siteActions } = data
  const totalPending = kpis.pendingVerifications + kpis.pendingReports + kpis.pendingMedia + kpis.pendingComments
  const pendingHref =
    kpis.pendingVerifications > 0 ? '/dashboard/admin/verification'
    : kpis.pendingReports > 0 ? '/dashboard/admin/reports'
    : kpis.pendingMedia > 0 ? '/dashboard/admin/review-media'
    : kpis.pendingComments > 0 ? '/dashboard/admin/comments'
    : '/dashboard/admin/verification'

  const trafficFmt = trafficSeries.map(d => ({ ...d, date: shortDate(d.date) }))
  const signupFmt = signupSeries.map(d => ({ ...d, date: shortDate(d.date) }))

  const roleData = [
    { name: t('rolesVisitors'), value: roleCounts.user || 0, color: '#8b5cf6' },
    { name: t('rolesModels'), value: roleCounts.model || 0, color: '#ec4899' },
    { name: t('rolesClubs'), value: roleCounts.company || 0, color: '#3b82f6' },
    { name: t('rolesAdmins'), value: roleCounts.admin || 0, color: '#64748b' },
  ]

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{t('subtitle')}</p>
        </div>
        <Link
          href="/dashboard/admin/statistics/traffic"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand bg-brand/10 rounded-lg hover:bg-brand/20"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('viewAnalytics')}</span>
          <span className="sm:hidden">{t('viewAnalytics')}</span>
        </Link>
      </div>

      {/* Urgent banner */}
      {totalPending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">{t('itemsRequireAttention', { count: totalPending })}</span> —
            {kpis.pendingMedia > 0 && ` ${t('media', { count: kpis.pendingMedia })},`}
            {kpis.pendingVerifications > 0 && ` ${t('verifications', { count: kpis.pendingVerifications })},`}
            {kpis.pendingReports > 0 && ` ${t('reportsCount', { count: kpis.pendingReports })}`}
          </p>
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3">
        <KpiCard label={t('kpiVisitors')} value={kpis.totalVisitors.toLocaleString()} icon={<UserCircle className="w-4 h-4" />} accent="text-violet-600 bg-violet-50" href="/dashboard/admin/users" />
        <KpiCard label={t('kpiModels')} value={kpis.totalModels.toLocaleString()} icon={<Users className="w-4 h-4" />} accent="text-brand bg-brand/10" href="/dashboard/admin/models" />
        <KpiCard label={t('kpiClubs')} value={kpis.totalClubs.toLocaleString()} icon={<Building2 className="w-4 h-4" />} accent="text-blue-600 bg-blue-50" href="/dashboard/admin/clubs" />
        <KpiCard label={t('kpiActiveListings')} value={kpis.activeListings.toLocaleString()} icon={<Briefcase className="w-4 h-4" />} accent="text-purple-600 bg-purple-50" href="/dashboard/admin/jobs-rents" />
        <KpiCard label={t('kpiActiveBanners')} value={kpis.activeBanners.toLocaleString()} icon={<Megaphone className="w-4 h-4" />} accent="text-rose-600 bg-rose-50" href="/dashboard/admin/banners" />
        <KpiCard label={t('kpiPageViews30d')} value={kpis.pageViews30d.toLocaleString()} icon={<Eye className="w-4 h-4" />} accent="text-sky-600 bg-sky-50" href="/dashboard/admin/statistics/traffic" />
        <KpiCard label={t('kpiRevenue30d')} value={money(kpis.revenue30d)} icon={<DollarSign className="w-4 h-4" />} accent="text-emerald-600 bg-emerald-50" sub={t('allTime', { value: money(kpis.revenueAllTime) })} href="/dashboard/admin/statistics/revenue" />
        <KpiCard label={t('kpiPendingModeration')} value={totalPending} icon={<ShieldCheck className="w-4 h-4" />} accent="text-amber-600 bg-amber-50" urgent={totalPending > 0} href={pendingHref} />
      </div>

      {/* Traffic + signups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title={t('siteTraffic')}
          subtitle={t('siteTrafficSub', { count: kpis.pageViews30d.toLocaleString() })}
          className="lg:col-span-2"
        >
          <StatsAreaChart
            data={trafficFmt}
            xKey="date"
            series={[{ key: 'views', name: t('pageViews'), color: '#ec4899' }]}
          />
        </ChartCard>

        <ChartCard title={t('roleDistribution')} subtitle={t('registeredUsers', { count: kpis.totalUsers.toLocaleString() })}>
          <StatsDonutChart data={roleData} height={240} />
        </ChartCard>
      </div>

      {/* Signups + top models */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title={t('newSignups')}
          subtitle={t('newSignupsSub', { count: kpis.signups30d })}
          className="lg:col-span-2"
        >
          <StatsBarChart
            data={signupFmt}
            xKey="date"
            stacked
            showLegend
            series={[
              { key: 'users', name: t('rolesVisitors'), color: '#8b5cf6' },
              { key: 'models', name: t('rolesModels'), color: '#ec4899' },
              { key: 'clubs', name: t('rolesClubs'), color: '#3b82f6' },
            ]}
          />
        </ChartCard>

        <ChartCard title={t('topModels')} subtitle={t('topModelsSub')}>
          {topModels.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">{t('noViewData')}</p>
          ) : (
            <div className="space-y-2">
              {topModels.slice(0, 8).map((m, i) => (
                <Link
                  key={m.id}
                  href={`/dashboard/admin/models/${m.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <span className="w-5 h-5 text-[10px] font-bold rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800 flex-1 truncate">{m.name}</span>
                  <span className="text-xs font-bold text-gray-500 tabular-nums">
                    {m.views.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Activity feed + moderation queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard
          title={t('recentActivity')}
          subtitle={t('recentActivitySub')}
          className="lg:col-span-2"
          right={
            <Link href="/latest-actions" className="text-xs font-semibold text-brand hover:underline">
              {t('viewAll')}
            </Link>
          }
        >
          {siteActions.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">{t('noRecentActivity')}</p>
          ) : (
            <div className="space-y-1.5 -m-1 max-h-96 overflow-y-auto">
              {siteActions.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center shrink-0 text-brand">
                    <ActivityIcon type={a.action_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{a.title || a.action_type}</p>
                    {a.description && (
                      <p className="text-xs text-gray-500 truncate">{a.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title={t('moderationQueue')} subtitle={t('moderationQueueSub')}>
          <div className="space-y-2">
            <QueueItem href="/dashboard/admin/verification" label={t('queueVerifications')} value={kpis.pendingVerifications} icon={<ShieldCheck className="w-4 h-4" />} color="emerald" />
            <QueueItem href="/dashboard/admin/review-media" label={t('queuePhotosVideos')} value={kpis.pendingMedia} icon={<Eye className="w-4 h-4" />} color="amber" />
            <QueueItem href="/dashboard/admin/reports" label={t('queueUserReports')} value={kpis.pendingReports} icon={<Flag className="w-4 h-4" />} color="rose" />
            <QueueItem href="/dashboard/admin/comments" label={t('queueComments')} value={kpis.pendingComments} icon={<MessageSquare className="w-4 h-4" />} color="orange" />
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

function ActivityIcon({ type }: { type?: string }) {
  switch (type) {
    case 'new_model': return <Users className="w-3.5 h-3.5" />
    case 'new_club': return <Building2 className="w-3.5 h-3.5" />
    case 'new_photo':
    case 'new_video': return <Eye className="w-3.5 h-3.5" />
    case 'new_comment': return <MessageSquare className="w-3.5 h-3.5" />
    case 'new_banner': return <Megaphone className="w-3.5 h-3.5" />
    case 'model_verified': return <ShieldCheck className="w-3.5 h-3.5" />
    default: return <TrendingUp className="w-3.5 h-3.5" />
  }
}

function QueueItem({ href, label, value, icon, color }: {
  href: string; label: string; value: number; icon: React.ReactNode; color: string
}) {
  const map: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
    orange: 'text-orange-600 bg-orange-50',
  }
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors">
      <div className={`w-9 h-9 rounded-lg ${map[color]} flex items-center justify-center`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800" dangerouslySetInnerHTML={{ __html: label }} />
      </div>
      <span className={`text-xl font-bold ${value > 0 ? 'text-gray-900' : 'text-gray-300'} tabular-nums`}>
        {value}
      </span>
    </Link>
  )
}
