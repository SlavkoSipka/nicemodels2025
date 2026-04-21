import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardSidebar userRole="company" />
      <div className="pt-14 md:pt-0">
        {children}
      </div>
    </>
  )
}
