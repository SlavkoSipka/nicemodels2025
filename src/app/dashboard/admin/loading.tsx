export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-6xl mx-auto space-y-5 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gray-200" />
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-56 bg-gray-100 rounded mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-gray-200 rounded-lg" />
              <div className="h-8 w-20 bg-gray-200 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3.5 h-24" />
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4 py-3"><div className="h-4 w-32 bg-gray-200 rounded" /></div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-gray-100" />
                <div className="flex-1"><div className="h-4 w-28 bg-gray-200 rounded" /><div className="h-3 w-20 bg-gray-100 rounded mt-1" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
