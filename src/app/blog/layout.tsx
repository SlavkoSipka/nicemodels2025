import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog – Tipps, Guides & Neuigkeiten',
  description:
    'Lese Artikel, Tipps und Guides rund um die Escort-Branche in der Schweiz auf NiceModels.ch.',
  alternates: { canonical: 'https://www.nicemodels.ch/blog' },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
