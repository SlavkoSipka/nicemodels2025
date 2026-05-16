import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/test-db',
          '/onboarding',
          '/reset-password',
          '/forgot-password',
          '/profile/edit',
          '/chat/',
          '/unsubscribe',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: 'https://www.nicemodels.ch/sitemap.xml',
  }
}
