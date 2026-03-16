import type { NextConfig } from "next";
import fs from 'fs'
import path from 'path'

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
    qualities: [75, 80, 85, 90],
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
};

export default nextConfig;
