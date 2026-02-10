import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardSidebar userRole="user" />
      {children}
    </>
  )
}
