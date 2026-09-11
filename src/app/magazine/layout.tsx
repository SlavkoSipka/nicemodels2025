import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  path: '/magazine',
  title: 'Magazin',
  description:
    'Ratgeber und Hintergrundartikel rund um Escort, Clubs und das Nachtleben in der Schweiz.',
})

export default function MagazineLayout({ children }: { children: React.ReactNode }) {
  return children
}
