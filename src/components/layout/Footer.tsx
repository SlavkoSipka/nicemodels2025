import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1f2126' }} className="text-gray-300">

      {/* Pink top accent line */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #9D174D 0%, #EC4899 50%, #F472B6 100%)' }} />

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Logo + tagline */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/logo2.png"
                alt="nicemodels.ch"
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#7DD3FC', opacity: 0.7 }}>
              The premium portal for Switzerland. Discreet, safe and professional.
            </p>
          </div>

          {/* Pages */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#F9A8D4' }}>
              Pages
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/',        label: 'Girls' },
                { href: '/clubs',   label: 'Clubs' },
                { href: '/comments',label: 'Comments' },
                { href: '/blog',    label: 'Blog' },
                { href: '/contact', label: 'Contact' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition-colors duration-200 hover:text-white" style={{ color: '#94A3B8' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#F9A8D4' }}>
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms',   label: 'Terms of Service' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="transition-colors duration-200 hover:text-white" style={{ color: '#94A3B8' }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#F9A8D4' }}>
              Support
            </h4>
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(186,230,253,0.06)', border: '1px solid rgba(186,230,253,0.10)' }}>
              <a
                href="https://wa.me/41000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm transition-colors group hover:text-white"
                style={{ color: '#94A3B8' }}
              >
                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#25D366' }}>
                  <MessageCircle className="w-4 h-4 text-white" />
                </span>
                <span>WhatsApp</span>
              </a>
              <a
                href="/contact"
                className="flex items-center gap-3 text-sm transition-colors hover:text-white"
                style={{ color: '#94A3B8' }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #9D174D, #EC4899)' }}
                >
                  <Mail className="w-4 h-4 text-white" />
                </span>
                <span>Contact form</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(186,230,253,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-xs" style={{ color: '#475569' }}>
          <span>© {new Date().getFullYear()} nicemodels.ch – All rights reserved</span>
          <div className="flex items-center gap-5">
            {[
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms',   label: 'Terms' },
              { href: '/contact', label: 'Imprint' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-sky-300 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
