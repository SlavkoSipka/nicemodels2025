export default function ModelProfileLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #BE185D 0px, #BE185D 370px, #1f2126 370px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button skeleton */}
        <div className="w-36 h-6 rounded-md mb-6" style={{ background: 'rgba(255,255,255,0.12)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_550px] gap-8">
          {/* Left — info skeletons */}
          <div className="space-y-3">
            {/* Hero card */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#1f2126', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' }}>
              <div style={{ height: 3, background: 'linear-gradient(90deg, #9D174D, #EC4899, #F472B6)' }} />
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-8 w-48 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="h-4 w-32 rounded-md" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-lg h-16" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  ))}
                </div>
                <div className="h-12 rounded-lg mt-2" style={{ background: 'rgba(236,72,153,0.18)' }} />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  <div className="h-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)' }} />
                </div>
              </div>
              {/* Stats rows */}
              <div style={{ background: '#16181d', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="h-3 w-16 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <div className="h-3 w-20 rounded" style={{ background: 'rgba(255,255,255,0.12)' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Rates skeleton */}
            <div className="rounded-xl overflow-hidden animate-pulse" style={{ background: '#1f2126' }}>
              <div className="px-5 py-3 flex gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="h-3 w-12 rounded" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                {[0,1].map(col => (
                  <div key={col} className="px-4 py-3 space-y-2.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-3 w-14 rounded" style={{ background: 'rgba(255,255,255,0.07)' }} />
                        <div className="h-3 w-16 rounded" style={{ background: 'rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* About me skeleton */}
            <div className="rounded-xl overflow-hidden animate-pulse" style={{ background: '#1f2126' }}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="h-3 w-16 rounded" style={{ background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div className="px-5 py-4 space-y-2">
                {[100, 90, 95, 70].map((w, i) => (
                  <div key={i} className="h-3 rounded" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.07)' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Right — photo skeleton */}
          <div>
            <div
              className="sticky rounded-lg animate-pulse"
              style={{
                top: 125,
                height: '75vh',
                background: 'linear-gradient(135deg, #2a2d34 0%, #1f2126 100%)',
              }}
            >
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(236,72,153,0.15)',
                  border: '2px solid rgba(236,72,153,0.25)',
                  animation: 'loader-logo-pulse 1.6s ease-in-out infinite',
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
