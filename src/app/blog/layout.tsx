import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  path: '/blog',
  title: 'Community & Diskussionen',
  description: 'Community-Diskussionen und Themen für Mitglieder auf NiceModels.ch. Jetzt anmelden und an Gesprächen teilnehmen.',
})

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
