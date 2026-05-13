import type { Metadata } from 'next'
import ClubsPageClient from './ClubsPageClient'
import { loadClubsForPage } from './loadClubsForPage'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'Clubs & Agenturen in der Schweiz',
  description:
    'Entdecke verifizierte Clubs und Agenturen in Zürich, Bern, Basel, Genf und der ganzen Schweiz auf NiceModels.ch.',
  alternates: { canonical: 'https://www.nicemodels.ch/clubs' },
}

export default async function ClubsPage() {
  const initialClubs = await loadClubsForPage()
  return <ClubsPageClient initialClubs={initialClubs} />
}
