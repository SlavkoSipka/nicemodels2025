import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const SITE_URL = 'https://www.nicemodels.ch'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/clubs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/jobs-rents`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/models-page`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/comments`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/latest-actions`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  let blogPages: MetadataRoute.Sitemap = []
  const { data: discussionTopics, error: discussionErr } = await admin
    .from('discussion_topics')
    .select('slug, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(500)

  if (!discussionErr && discussionTopics?.length) {
    blogPages = discussionTopics.map(t => ({
      url: `${SITE_URL}/blog/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))
  }

  let modelPages: MetadataRoute.Sitemap = []
  const { data: models } = await admin
    .from('profiles')
    .select('id, updated_at')
    .eq('role', 'model')
    .order('updated_at', { ascending: false })
    .limit(5000)

  if (models?.length) {
    modelPages = models.map(m => ({
      url: `${SITE_URL}/models/${m.id}`,
      lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  }

  let clubPages: MetadataRoute.Sitemap = []
  const { data: clubs } = await admin
    .from('profiles')
    .select('id, updated_at')
    .eq('role', 'company')
    .order('updated_at', { ascending: false })
    .limit(5000)

  if (clubs?.length) {
    clubPages = clubs.map(c => ({
      url: `${SITE_URL}/clubs/${c.id}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  }

  let listingPages: MetadataRoute.Sitemap = []
  const sitemapNowIso = new Date().toISOString()
  const { data: listings } = await admin
    .from('job_listings')
    .select('id, created_at')
    .eq('status', 'active')
    .or(`expires_at.is.null,expires_at.gt.${sitemapNowIso}`)
    .order('created_at', { ascending: false })
    .limit(2000)

  if (listings?.length) {
    listingPages = listings.map(l => ({
      url: `${SITE_URL}/jobs-rents/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  }

  return [...staticPages, ...blogPages, ...modelPages, ...clubPages, ...listingPages]
}
