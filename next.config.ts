import type { NextConfig } from "next";
import fs from 'fs'
import path from 'path'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Copy TinyMCE to public folder for self-hosting (no API key needed)
const tinymceSrc = path.join(process.cwd(), 'node_modules/tinymce')
const tinymceDest = path.join(process.cwd(), 'public/tinymce')
if (fs.existsSync(tinymceSrc)) {
  fs.cpSync(tinymceSrc, tinymceDest, { recursive: true, force: false, errorOnExist: false })
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
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
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
