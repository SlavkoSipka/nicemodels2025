export default function UserDashboardLoading() {
  return (
    <div className="ml-[280px] min-h-screen bg-gray-50">
      <div className="py-6 px-6">
        <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gray-200" />
            <div>
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
            <div className="h-10 bg-gray-100 rounded-lg" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 h-24" />
            <div className="bg-white border border-gray-200 rounded-lg p-4 h-24" />
            <div className="bg-white border border-gray-200 rounded-lg p-4 h-24" />
          </div>
        </div>
      </div>
    </div>
  )
}
