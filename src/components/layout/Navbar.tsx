'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher'
import { useAuth } from '@/components/auth/AuthProvider'

// Heavy widget: keep it out of the main bundle and only load after hydration
// when the user is actually logged in.
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), {
  ssr: false,
  loading: () => null,
})

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('nav')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      {/* Top Bar - Baby blue */}
      <div style={{ backgroundColor: '#e8f4fd', borderBottom: '1px solid rgba(137,207,240,0.25)' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-12 sm:h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center group"
              onClick={(e) => {
                if (pathname === '/') {
                  e.preventDefault()
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('nicemodels:reset-home'))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }
              }}
            >
              <Image
                src="/logo.webp"
                alt={t('logoAlt')}
                width={240}
                height={60}
                sizes="(max-width: 640px) 128px, 192px"
                className="h-8 w-auto sm:h-10 md:h-12"
                priority
              />
            </Link>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-stretch h-16 self-stretch" style={{ marginBottom: '-1px' }}>
              {/* Language */}
              <LanguageSwitcher variant="navbar" />

              {user ? (
                <>
                  <Link
                    href={
                      profile?.role === 'admin'   ? '/dashboard/admin'   :
                      profile?.role === 'model'   ? '/dashboard/model'   :
                      profile?.role === 'company' ? '/dashboard/company' :
                      '/dashboard'
                    }
                    className="flex items-center justify-center gap-2 px-6 text-xs font-bold text-white transition-all border-l hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #38bdf8, #89CFF0)', borderColor: 'rgba(137,207,240,0.35)' }}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    <span>{profile?.username || t('user')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center px-6 text-xs font-semibold transition-all border-l"
                    style={{ color: '#475569', borderColor: 'rgba(137,207,240,0.35)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.backgroundColor = 'rgba(137,207,240,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="flex items-center justify-center px-6 text-xs font-bold text-white transition-all border-l hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #be185d, #ec4899)', borderColor: 'rgba(137,207,240,0.35)' }}
                  >
                    {t('register')}
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center px-6 text-xs font-semibold transition-all border-l border-r"
                    style={{ color: '#475569', borderColor: 'rgba(137,207,240,0.35)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ec4899'; e.currentTarget.style.backgroundColor = 'rgba(236,72,153,0.05)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    {t('login')}
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg transition-all"
              style={{ color: '#94a3b8' }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Soft pink */}
      <div style={{ background: 'linear-gradient(90deg, #ec4899, #f472b6)', boxShadow: '0 2px 8px rgba(236,72,153,0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="hidden lg:flex items-center justify-center gap-1">
            {[
              { href: '/models-page',    label: t('models') },
              { href: '/clubs',          label: t('clubsAgency') },
              { href: '/jobs-rents',     label: t('jobsRent') },
              { href: '/latest-actions', label: t('latestActions') },
              { href: '/comments',       label: t('comments') },
              { href: '/contact',        label: t('contact') },
              { href: '/blog',           label: t('blog') },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative px-5 py-2.5 text-[13px] font-semibold tracking-wide transition-all duration-200 group"
                style={{ color: 'rgba(255,255,255,0.85)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)' }}
              >
                {label}
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 rounded-full transition-all duration-300 group-hover:w-3/4"
                  style={{ backgroundColor: 'white' }}
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden" style={{ backgroundColor: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {[
              { href: '/models-page',    label: t('models') },
              { href: '/clubs',          label: t('clubsAgency') },
              { href: '/jobs-rents',     label: t('jobsRent') },
              { href: '/latest-actions', label: t('latestActions') },
              { href: '/comments',       label: t('comments') },
              { href: '/contact',        label: t('contact') },
              { href: '/blog',           label: t('blog') },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-4 py-3 text-sm font-semibold rounded-lg transition-all"
                style={{ color: '#475569' }}
                onClick={() => setMobileMenuOpen(false)}
                onMouseEnter={e => { e.currentTarget.style.color = '#ec4899'; e.currentTarget.style.backgroundColor = '#fef7fa' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {label}
              </Link>
            ))}

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }} className="pt-4 mt-4">
              <LanguageSwitcher variant="mobile" />
            </div>

            <div className="space-y-2">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm" style={{ color: '#94a3b8' }}>
                    {t.rich('loggedInAs', {
                      username: () => (
                        <span className="font-semibold" style={{ color: '#1a1a2e' }}>{profile?.username}</span>
                      ),
                    })}
                  </div>
                  <Link
                    href={
                      profile?.role === 'admin'   ? '/dashboard/admin'   :
                      profile?.role === 'model'   ? '/dashboard/model'   :
                      profile?.role === 'company' ? '/dashboard/company' :
                      '/dashboard'
                    }
                    className="block w-full px-4 py-3 text-sm font-bold text-white text-center rounded-lg transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #be185d, #ec4899)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                    className="block w-full px-4 py-3 text-sm font-bold text-center rounded-lg transition-all"
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="block w-full px-4 py-3 text-sm font-bold text-white text-center rounded-lg transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #be185d, #ec4899)' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('register').toUpperCase()}
                  </Link>
                  <Link
                    href="/login"
                    className="block w-full px-4 py-3 text-sm font-bold text-center rounded-lg transition-all"
                    style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('login').toUpperCase()}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {user && <ChatWidget />}
    </nav>
  )
}
