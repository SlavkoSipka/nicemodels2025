import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discussions – Community | NiceModels',
  description:
    'Community discussions and topics for members on NiceModels.ch. Sign in to take part in the conversation.',
  alternates: { canonical: 'https://www.nicemodels.ch/blog' },
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children
}
