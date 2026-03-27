import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kontakt',
  description:
    'Kontaktiere das NiceModels.ch Team. Wir helfen dir bei Fragen, Support und Partnerschaften.',
  alternates: { canonical: 'https://www.nicemodels.ch/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
