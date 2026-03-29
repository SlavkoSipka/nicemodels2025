import Navbar from '@/components/layout/Navbar'

export default function ModelsPageLoading() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen" style={{ background: '#fce9f3' }}>
        <div className="max-w-[1280px] mx-auto px-2 sm:px-4 pt-4 animate-pulse">
          <div className="flex gap-2 sm:gap-3 mb-4">
            <div className="h-10 flex-1 bg-white/60 rounded-lg" />
            <div className="h-10 flex-1 bg-white/60 rounded-lg" />
            <div className="h-10 flex-1 bg-white/60 rounded-lg hidden sm:block" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white/50">
                <div className="aspect-[3/4] bg-pink-200/40" />
                <div className="p-2.5 space-y-2">
                  <div className="h-4 w-3/4 bg-pink-200/40 rounded" />
                  <div className="h-3 w-1/2 bg-pink-200/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
