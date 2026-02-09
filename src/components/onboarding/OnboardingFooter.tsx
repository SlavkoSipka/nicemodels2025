'use client'

export default function OnboardingFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full border-t border-gray-200/80 bg-white/70 backdrop-blur-sm z-10">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-1">
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} nicemodels.ch · Onboarding
        </p>
        <p className="text-[11px] text-gray-400 text-center md:text-right">
          Profile and club onboarding are{' '}
          <span className="font-semibold text-pink-600">free while we launch</span>.
        </p>
      </div>
    </footer>
  )
}

