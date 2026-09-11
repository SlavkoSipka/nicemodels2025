import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  path: '/blog',
  title: 'Blog',
  description:
    'Ratgeber und Hintergrundartikel rund um Inserate, Sicherheit und das Nachtleben in der Schweiz.',
})

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
