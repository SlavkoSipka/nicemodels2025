import Navbar from '@/components/layout/Navbar'

export default function ClubLoading() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: '#fdf2f8' }}>
        <div className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-8 animate-pulse">
          {/* Hero / gallery skeleton */}
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl bg-pink-200/60 mb-6" />

          <div className="flex flex-col md:flex-row gap-4 sm:gap-8">
            {/* Main content */}
            <div className="flex-1 space-y-5">
              <div className="h-8 w-56 bg-pink-200/60 rounded-lg" />
              <div className="flex gap-3">
                <div className="h-5 w-28 bg-pink-200/40 rounded" />
                <div className="h-5 w-20 bg-pink-200/40 rounded" />
              </div>
              <div className="h-px bg-pink-200/40" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-pink-200/40 rounded" />
                <div className="h-4 w-5/6 bg-pink-200/40 rounded" />
                <div className="h-4 w-3/6 bg-pink-200/40 rounded" />
              </div>
              <div className="h-px bg-pink-200/40" />
              <div className="h-5 w-32 bg-pink-200/50 rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-pink-200/30 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Sidebar skeleton */}
            <div className="w-full md:w-72 space-y-4">
              <div className="h-40 bg-pink-200/30 rounded-xl" />
              <div className="h-32 bg-pink-200/30 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
