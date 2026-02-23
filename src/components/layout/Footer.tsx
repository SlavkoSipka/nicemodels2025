import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#1f2126' }} className="text-gray-300">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Logo */}
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
            <p className="text-sm text-gray-500 leading-relaxed">
              The premium portal for Switzerland. Discreet, safe and professional.
            </p>
          </div>

          {/* Column 1 */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Pages
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Girls
                </Link>
              </li>
              <li>
                <Link href="/clubs" className="text-gray-400 hover:text-white transition-colors">
                  Clubs
                </Link>
              </li>
              <li>
                <Link href="/comments" className="text-gray-400 hover:text-white transition-colors">
                  Comments
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Support box */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Support
            </h4>
            <div
              className="rounded-lg p-4 space-y-3"
              style={{ backgroundColor: '#2a2d34' }}
            >
              <a
                href="https://wa.me/41000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors group"
              >
                <span
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </span>
                <span>WhatsApp</span>
              </a>
              <a
                href="/contact"
                className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <span
                  className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#3a3d44' }}
                >
                  <Mail className="w-4 h-4 text-gray-300" />
                </span>
                <span>Contact form</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTopColor: '#2e3138' }} className="border-t">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} nicemodels.ch – All rights reserved</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-gray-300 transition-colors">
              Imprint
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
