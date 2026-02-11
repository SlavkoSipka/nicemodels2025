import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardSidebar userRole="company" />
      {children}
    </>
  )
}
