export default function ModelProfileLoading() {
  const cardBase = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  } as const

  const cardSoft = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  } as const

  const bar = (w: string, h = 'h-3') => (
    <div className={`${h} rounded`} style={{ width: w, background: '#e2e8f0' }} />
  )

  return (
    <div className="min-h-screen" style={{ background: '#fce9f3' }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="w-44 h-5 rounded-md mb-6 animate-pulse" style={{ background: '#ede0e8' }} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_550px] gap-8">
          <div className="space-y-3">
            {/* Hero card — matches ModelProfileClient */}
            <div className="rounded-xl overflow-hidden" style={cardBase}>
              <div className="p-6 space-y-4 animate-pulse">
                <div className="h-9 w-52 rounded-lg" style={{ background: '#e2e8f0' }} />
                <div className="h-4 w-36 rounded-md" style={{ background: '#f1f5f9' }} />
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-lg h-16" style={{ background: '#f8fafc' }} />
                  ))}
                </div>
                <div
                  className="h-12 rounded-lg mt-2"
                  style={{ background: 'linear-gradient(90deg, rgba(157,23,77,0.2), rgba(236,72,153,0.25))' }}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 rounded-lg" style={{ background: '#f1f5f9' }} />
                  <div className="h-10 rounded-lg" style={{ background: '#f1f5f9' }} />
                </div>
              </div>
              <div className="animate-pulse" style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                  >
                    <div className="h-3 w-14 rounded" style={{ background: '#e2e8f0' }} />
                    <div className="h-3 w-20 rounded" style={{ background: '#f1f5f9' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Rates skeleton */}
            <div className="rounded-xl overflow-hidden animate-pulse" style={cardSoft}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div className="h-3 w-12 rounded" style={{ background: '#e2e8f0' }} />
              </div>
              <div className="grid grid-cols-2" style={{ borderColor: '#f1f5f9' }}>
                {[0, 1].map((col) => (
                  <div key={col} className={`px-4 py-3 space-y-2.5 ${col === 0 ? 'border-r border-[#f1f5f9]' : ''}`}>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-3 w-14 rounded" style={{ background: '#f1f5f9' }} />
                        <div className="h-3 w-16 rounded" style={{ background: '#e2e8f0' }} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* About skeleton */}
            <div className="rounded-xl overflow-hidden animate-pulse" style={cardSoft}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                {bar('4rem')}
              </div>
              <div className="px-5 py-4 space-y-2">
                {[100, 90, 95, 70].map((w, i) => (
                  <div key={i} className="h-3 rounded" style={{ width: `${w}%`, background: '#f1f5f9' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Photo area — same sticky + black stage as live profile */}
          <div>
            <div
              className="sticky rounded-lg animate-pulse relative overflow-hidden"
              style={{
                top: 125,
                height: '75vh',
                background: '#000000',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center"
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(236,72,153,0.2)',
                    border: '2px solid rgba(236,72,153,0.45)',
                    animation: 'loader-logo-pulse 1.6s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
