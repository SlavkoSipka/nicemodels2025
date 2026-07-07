import type { NextConfig } from "next";
import fs from 'fs'
import path from 'path'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Copy TinyMCE to public folder for self-hosting (no API key needed)
const tinymceSrc = path.join(process.cwd(), 'node_modules/tinymce')
const tinymceDest = path.join(process.cwd(), 'public/tinymce')
if (fs.existsSync(tinymceSrc)) {
  try {
    fs.cpSync(tinymceSrc, tinymceDest, { recursive: true, force: false, errorOnExist: false })
  } catch {
    // non-fatal: skip self-host copy if disk/permissions fail
  }
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  // Tree-shake huge icon/chart libs so only the icons actually used end up in the bundle.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@supabase/ssr',
      '@supabase/supabase-js',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [60, 75, 80, 85],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ykzqjwqomaeuppubofid.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    // ─── CSP Inventory (as of 2026-06-26) ────────────────────────────────────
    // script-src : 'self' + Next.js inline hydration scripts ('unsafe-inline')
    //              + Stripe.js loaded from js.stripe.com by @stripe/stripe-js
    // style-src  : 'self' + Tailwind/inline styles ('unsafe-inline')
    // img-src    : self + data:/blob: (Next.js image opt) + Supabase storage
    //              + images.unsplash.com (next.config remotePatterns)
    // font-src   : 'self' (next/font self-hosts Google Fonts at build time)
    //              + data: (base64 font fallbacks)
    // connect-src: self (API routes, analytics) + Supabase REST + Supabase
    //              Realtime WebSocket (used in ChatWidget, chat pages)
    //              + Stripe API/hooks (all *.stripe.com)
    //              + EmailJS API (contact form via @emailjs/browser)
    // frame-src  : *.stripe.com (Stripe 3DS / fraud-detection iframes)
    // object-src : 'none' — no Flash or plugin content
    // base-uri   : 'self' — block base-tag injection attacks
    // form-action: 'self' — all HTML form actions post to our own routes
    //
    // ⚠️  REPORT-ONLY — this header LOGS violations but does NOT block anything.
    //     Switch the key to 'Content-Security-Policy' only after testing:
    //     1. Homepage (fonts, images, analytics)
    //     2. A model profile (Supabase images)
    //     3. The Stripe checkout flow (js.stripe.com, Stripe redirect)
    //     4. The contact form (EmailJS)
    //     5. The chat page (Supabase Realtime WebSocket)
    //     6. The TinyMCE-using dashboard pages (AdminListingEditClient etc.)
    //     Check browser DevTools → Console for "Refused to …" messages.
    //     See PHASE_6_REPORT.md for the full testing checklist.
    // ─────────────────────────────────────────────────────────────────────────
    const CSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://ykzqjwqomaeuppubofid.supabase.co https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self' https://ykzqjwqomaeuppubofid.supabase.co wss://ykzqjwqomaeuppubofid.supabase.co https://*.stripe.com https://api.emailjs.com",
      "frame-src https://*.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // REPORT-ONLY — see comment above before switching to enforcing mode
          { key: 'Content-Security-Policy-Report-Only', value: CSP },
        ],
      },
      // Aggressive cache for static assets and Next image output.
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },
};

export default withNextIntl(nextConfig);
