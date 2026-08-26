import type { Metadata } from 'next'

const SITE_URL = 'https://nicemodels.ch'
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.webp`

export interface BreadcrumbSegment {
  name: string
  path: string
}

/**
 * Builds a schema.org BreadcrumbList JSON-LD object. Pass segments in order
 * from the homepage down to (but not including — see `current`) the current
 * page, then `current`'s own name/path as the final segment.
 */
export function buildBreadcrumbJsonLd(segments: BreadcrumbSegment[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: segments.map((segment, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: segment.name,
      item: `${SITE_URL}${segment.path}`,
    })),
  }
}

interface BuildMetadataOptions {
  path: string
  title: string
  description: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
}

export function buildMetadata({
  path,
  title,
  description,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
}: BuildMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'de-CH': url,
        'x-default': url,
      },
    },
    openGraph: {
      title,
      description,
      type: ogType,
      url,
      siteName: 'NiceModels.ch',
      locale: 'de_CH',
      images: [{ url: ogImage, width: 512, height: 512, alt: 'NiceModels.ch' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}
