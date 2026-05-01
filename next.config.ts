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
    ]
  },
};

export default withNextIntl(nextConfig);
