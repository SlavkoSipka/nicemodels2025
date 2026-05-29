import Navbar from '@/components/layout/Navbar'

export default function JobsRentsLoading() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-8 animate-pulse">
          <div className="h-8 w-56 bg-gray-200 rounded-lg mb-6" />
          <div className="flex flex-col gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex gap-3 rounded-xl bg-white p-3"
                style={{ border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <div className="h-24 w-24 shrink-0 bg-gray-200 rounded-lg" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  <div className="h-3 w-1/3 bg-gray-100 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
