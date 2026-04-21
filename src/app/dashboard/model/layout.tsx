import DashboardSidebar from '@/components/layout/DashboardSidebar'
import LiveLocationGate from '@/components/live-location/LiveLocationGate'

export default function ModelDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardSidebar userRole="model" />
      <LiveLocationGate />
      <div className="pt-14 md:pt-0">
        {children}
      </div>
    </>
  )
}
