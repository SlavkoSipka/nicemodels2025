function Bar({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-gray-200/90 animate-pulse ${className}`}
    />
  )
}

export default function DashboardRouteSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pt-14 md:pt-0">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[280px] flex-col gap-6 border-r border-gray-100 bg-white p-6 z-30">
        <Bar className="h-9 w-36" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Bar key={i} className="h-10 w-full" />
          ))}
        </div>
        <Bar className="mt-auto h-10 w-full" />
      </aside>

      <div className="md:ml-[280px] px-4 py-6 md:px-8 md:py-8">
        <div className="md:hidden flex items-center gap-3 mb-6">
          <Bar className="h-10 w-10 rounded-lg shrink-0" />
          <Bar className="h-9 flex-1 max-w-[200px]" />
        </div>
        <Bar className="h-10 w-64 max-w-[80%] mb-8" />
        <div className="grid gap-4 max-w-4xl">
          <Bar className="h-32 w-full" />
          <Bar className="h-44 w-full" />
          <Bar className="h-56 w-full" />
        </div>
      </div>
    </div>
  )
}
