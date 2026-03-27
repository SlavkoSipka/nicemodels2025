import Navbar from '@/components/layout/Navbar'

export default function ModelLoading() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: '#fdf2f8' }}>
        <div className="max-w-6xl mx-auto px-3 py-4 sm:px-6 sm:py-8 animate-pulse">
          <div className="flex flex-col md:flex-row gap-4 sm:gap-8">
            {/* Photo skeleton */}
            <div className="w-full md:w-[380px] flex-shrink-0">
              <div className="aspect-[3/4] rounded-xl bg-pink-200/60" />
              <div className="grid grid-cols-5 gap-2 mt-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-pink-200/40" />
                ))}
              </div>
            </div>

            {/* Content skeleton */}
            <div className="flex-1 space-y-5">
              <div className="h-8 w-48 bg-pink-200/60 rounded-lg" />
              <div className="flex gap-3">
                <div className="h-5 w-24 bg-pink-200/40 rounded" />
                <div className="h-5 w-20 bg-pink-200/40 rounded" />
                <div className="h-5 w-28 bg-pink-200/40 rounded" />
              </div>
              <div className="h-px bg-pink-200/40" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-pink-200/40 rounded" />
                <div className="h-4 w-5/6 bg-pink-200/40 rounded" />
                <div className="h-4 w-4/6 bg-pink-200/40 rounded" />
              </div>
              <div className="h-px bg-pink-200/40" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-9 bg-pink-200/30 rounded-lg" />
                ))}
              </div>
              <div className="h-px bg-pink-200/40" />
              <div className="space-y-2">
                <div className="h-5 w-32 bg-pink-200/50 rounded" />
                <div className="h-4 w-40 bg-pink-200/30 rounded" />
                <div className="h-4 w-36 bg-pink-200/30 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
