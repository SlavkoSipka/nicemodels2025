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
    <nav className="sticky top-0 z-50 shadow-2xl">
      {/* Top Bar - Black background */}
      <div className="border-b border-gray-800" style={{ backgroundColor: '#1f2126' }}>
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
            <div className="hidden lg:flex items-center gap-3">
              {/* Language Selector */}
              <div className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-300 border border-gray-700 rounded-lg">
                <span className="text-base">🇩🇪</span>
                DE
              </div>

              {/* If user is logged in, show user + logout buttons, otherwise show auth buttons */}
              {user ? (
                <>
                  <Link
                    href={
                      profile?.role === 'admin' ? '/dashboard/admin' :
                      profile?.role === 'model' ? '/dashboard/model' : 
                      profile?.role === 'company' ? '/dashboard/company' : 
                      '/dashboard'
                    }
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span>{profile?.username || 'User'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-semibold text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-800 hover:text-white transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 text-sm font-bold bg-brand text-white hover:bg-brand-hover rounded-lg transition-all shadow-lg shadow-brand/30"
                  >
                    REGISTER
                  </Link>
                  
                  <Link
                    href="/login"
                    className="px-5 py-2.5 text-sm font-bold bg-white text-gray-900 hover:bg-gray-100 rounded-lg transition-all shadow-lg"
                  >
                    LOG IN
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

      {/* Navigation Bar - Pink gradient */}
      <div className="border-t border-brand/50 bg-brand">
        <div className="max-w-7xl mx-auto px-4">
          <div className="hidden lg:flex items-center justify-center gap-0 py-0">
            <Link
              href="/"
              className="px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Girls
            </Link>
            <Link
              href="/clubs"
              className="px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Clubs/Agency
            </Link>
            <Link
              href="/comments"
              className="px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Comments
            </Link>
            <Link
              href="/contact"
              className="px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Contact
            </Link>
            <Link
              href="/blog"
              className="px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Blog
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-gray-900 border-t border-brand/30">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <Link
              href="/"
              className="block px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-brand/20 hover:text-white rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Girls
            </Link>
            <Link
              href="/clubs"
              className="block px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-brand/20 hover:text-white rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Clubs/Agency
            </Link>
            <Link
              href="/comments"
              className="block px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-brand/20 hover:text-white rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Comments
            </Link>
            <Link
              href="/contact"
              className="block px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-brand/20 hover:text-white rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            <Link
              href="/blog"
              className="block px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-brand/20 hover:text-white rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Blog
            </Link>
            
            <div className="border-t border-gray-800 pt-4 mt-4 space-y-2">
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-gray-400">
                    Logged in as <span className="text-white font-semibold">{profile?.username}</span>
                  </div>
                  <Link
                    href={
                      profile?.role === 'admin' ? '/dashboard/admin' :
                      profile?.role === 'model' ? '/dashboard/model' : 
                      profile?.role === 'company' ? '/dashboard/company' : 
                      '/dashboard'
                    }
                    className="block w-full px-4 py-3 text-sm font-bold bg-brand text-white text-center hover:bg-brand-hover rounded-lg transition-all shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    📊 Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="block w-full px-4 py-3 text-sm font-bold bg-red-600 text-white text-center hover:bg-red-700 rounded-lg transition-all shadow-lg"
                  >
                    🚪 Logout
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
