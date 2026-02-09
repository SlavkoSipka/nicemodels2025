import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default function ModelDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardSidebar userRole="model" />
      {children}
    </>
  )
}
