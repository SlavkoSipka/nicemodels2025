import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  path: '/contact',
  title: 'Kontakt',
  description: 'Kontaktiere das NiceModels.ch Team. Wir helfen dir bei Fragen, Support und Partnerschaften.',
})

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
