'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ChatWidget from '@/components/chat/ChatWidget'

export default function Navbar() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        
        // Get profile info
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, role')
          .eq('id', user.id)
          .single()
        
        setProfile(profileData)
      }
    }
    
    checkUser()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()

    // Počisti sav lokalni state / storage da bude kao da nikad nisi bio na sajtu
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.clear()
        window.sessionStorage.clear()
      } catch (e) {
        console.error('Error clearing storage on logout:', e)
      }
    }

    setUser(null)
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-50 shadow-lg">
      {/* Top Bar - Clean dark */}
      <div style={{ backgroundColor: '#1f2126', borderBottom: '1px solid #2a2d34' }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <Image
                src="/logo2.png"
                alt="nicemodels.ch"
                width={240}
                height={60}
                className="h-10 w-auto md:h-12"
                priority
              />
            </Link>

            {/* Desktop Auth Section */}
            <div className="hidden lg:flex items-stretch h-16 self-stretch">
              {/* Language Selector */}
              <div className="flex items-center justify-center gap-1.5 px-5 text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer select-none border-l border-white/10">
                <span>🇩🇪</span>
                <span>DE</span>
              </div>

              {user ? (
                <>
                  <Link
                    href={
                      profile?.role === 'admin'   ? '/dashboard/admin'   :
                      profile?.role === 'model'   ? '/dashboard/model'   :
                      profile?.role === 'company' ? '/dashboard/company' :
                      '/dashboard'
                    }
                    className="flex items-center justify-center gap-2 px-6 text-xs font-bold text-white transition-all border-l border-white/10 hover:brightness-110"
                    style={{ background: 'linear-gradient(180deg, #1D4ED8, #3B82F6)' }}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{profile?.username || 'User'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center px-6 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition-all border-l border-white/10"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="flex items-center justify-center px-6 text-xs font-bold text-white transition-all border-l border-white/10 hover:brightness-110"
                    style={{ background: 'linear-gradient(180deg, #BE185D, #EC4899)' }}
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="flex items-center justify-center px-6 text-xs font-bold text-white transition-all border-l border-r border-white/10 hover:brightness-110"
                    style={{ background: 'linear-gradient(180deg, #1D4ED8, #3B82F6)' }}
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Vivid pink */}
      <div style={{ backgroundColor: '#EC4899', borderBottom: '1px solid #DB2777' }}>
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="hidden lg:flex items-center justify-center gap-10">
            {[
              { href: '/',               label: 'Girls' },
              { href: '/clubs',          label: 'Clubs / Agency' },
              { href: '/jobs-rents',     label: 'Jobs / Rent' },
              { href: '/latest-actions', label: 'Latest Actions' },
              { href: '/comments',       label: 'Comments' },
              { href: '/contact',        label: 'Contact' },
              { href: '/blog',           label: 'Blog' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative px-4 py-3 text-sm font-bold tracking-wide transition-colors duration-200 group"
                style={{ color: 'rgba(255,255,255,0.92)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.92)' }}
              >
                {label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-4/5" style={{ backgroundColor: 'white' }} />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden" style={{ backgroundColor: '#1f2126', borderTop: '1px solid #2a2d34' }}>
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {[
              { href: '/',               label: 'Girls' },
              { href: '/clubs',          label: 'Clubs / Agency' },
              { href: '/jobs-rents',     label: 'Jobs / Rent' },
              { href: '/latest-actions', label: 'Latest Actions' },
              { href: '/comments',       label: 'Comments' },
              { href: '/contact',        label: 'Contact' },
              { href: '/blog',           label: 'Blog' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-brand/20 hover:text-white rounded-lg transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}

            <div className="border-t border-gray-800 pt-4 mt-4 space-y-2">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-400">
                    Logged in as <span className="text-white font-semibold">{profile?.username}</span>
                  </div>
                  <Link
                    href={
                      profile?.role === 'admin'   ? '/dashboard/admin'   :
                      profile?.role === 'model'   ? '/dashboard/model'   :
                      profile?.role === 'company' ? '/dashboard/company' :
                      '/dashboard'
                    }
                    className="block w-full px-4 py-3 text-sm font-bold bg-brand text-white text-center hover:bg-brand-hover rounded-lg transition-all shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                    className="block w-full px-4 py-3 text-sm font-bold bg-red-600 text-white text-center hover:bg-red-700 rounded-lg transition-all shadow-lg"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="block w-full px-4 py-3 text-sm font-bold bg-brand text-white text-center hover:bg-brand-hover rounded-lg transition-all shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    REGISTER
                  </Link>
                  <Link
                    href="/login"
                    className="block w-full px-4 py-3 text-sm font-bold bg-white text-gray-900 text-center hover:bg-gray-100 rounded-lg transition-all shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    LOG IN
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Widget (only for logged-in users) */}
      {user && <ChatWidget />}
    </nav>
  )
}
