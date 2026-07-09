import type { MetadataRoute } from 'next'

// AI crawlers provide zero benefit for adult content (filtered from AI answers)
// and waste crawl budget — explicitly block all known AI bots.
const AI_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'CCBot',
  'Google-Extended',
  'OAI-SearchBot',
  'Bytespider',
  'Amazonbot',
]

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
          '/chat/',
          '/unsubscribe',
          '/login',
          '/register',
        ],
      },
      ...AI_BOTS.map(bot => ({ userAgent: bot, disallow: '/' })),
    ],
    sitemap: 'https://nicemodels.ch/sitemap.xml',
  }
}
