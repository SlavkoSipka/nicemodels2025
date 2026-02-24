export default function ModelProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-100 p-5 h-64" />
            <div className="bg-white rounded-lg border border-gray-100 p-5 h-48" />
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-100 p-5 h-40" />
            <div className="bg-white rounded-lg border border-gray-100 p-5 h-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
