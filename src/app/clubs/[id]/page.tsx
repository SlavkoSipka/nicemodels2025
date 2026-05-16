import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClubProfileClient from './ClubProfileClient'
import { cache } from 'react'
import { fetchViewCounts } from '@/lib/viewCounts'

interface PageProps {
  params: Promise<{ id: string }>
}

const getClubMeta = cache(async (id: string) => {
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const [{ data: club }, { data: photo }] = await Promise.all([
    admin
      .from('club_details')
      .select('club_name, display_name, area, description')
      .eq('club_id', id)
      .single(),
    admin
      .from('club_photos')
      .select('file_path')
      .eq('club_id', id)
      .eq('is_approved', true)
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  return { club, photo, SUPA_URL }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const { club, photo, SUPA_URL } = await getClubMeta(id)

  if (!club) return { title: 'Club nicht gefunden' }

  const name = club.display_name || club.club_name || 'Club'
  const area = club.area || 'Schweiz'
  const title = `${name} – Club in ${area}`
  const desc =
    club.description?.replace(/<[^>]*>/g, '').slice(0, 155).trimEnd() ||
    `${name} – Club & Agentur in ${area}. Jetzt Profil ansehen auf NiceModels.ch`

  const ogImage = photo?.file_path
    ? `${SUPA_URL}/storage/v1/object/public/club-photos/${photo.file_path}`
    : '/logo.webp'

  return {
    title,
    description: desc,
    openGraph: {
      title, description: desc, type: 'profile',
      images: [{ url: ogImage, alt: name }],
    },
    twitter: {
      card: 'summary_large_image', title, description: desc, images: [ogImage],
    },
    alternates: { canonical: `https://www.nicemodels.ch/clubs/${id}` },
  }
}

export default async function ClubPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const [
    { data: profile },
    { data: clubDetails },
    { data: contactDetails },
    { data: workingHours },
    { data: photos },
    { data: accepted },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).eq('role', 'company').single(),
    supabase.from('club_details').select('*').eq('club_id', id).single(),
    supabase.from('club_contact_details').select('*').eq('club_id', id).maybeSingle(),
    supabase.from('club_working_hours').select('*').eq('club_id', id).maybeSingle(),
    supabase.from('club_photos').select('*').eq('club_id', id).eq('is_approved', true).order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
    admin.from('club_invites').select('invited_model_id').eq('club_id', id).eq('status', 'accepted'),
  ])

  if (!profile) notFound()

  const photosWithUrls = (photos ?? []).map(photo => ({
    ...photo,
    url: `${SUPA_URL}/storage/v1/object/public/club-photos/${photo.file_path}`,
  }))

  let clubModels: any[] = []

  if (accepted?.length) {
    const modelIds = accepted.map((a: any) => a.invited_model_id)

    const [{ data: modelProfiles }, { data: modelDetails }, { data: modelPhotos }] = await Promise.all([
      admin.from('profiles').select('id, username, is_verified').in('id', modelIds),
      admin.from('model_details').select('model_id, showname, city, age').in('model_id', modelIds),
      admin.from('model_photos').select('model_id, file_path').in('model_id', modelIds)
        .eq('is_approved', true).order('model_id').order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
    ])

    const detailsMap = new Map((modelDetails ?? []).map((d: any) => [d.model_id, d]))
    const photosMap = new Map<string, string>()
    for (const p of modelPhotos ?? []) {
      if (!photosMap.has(p.model_id) && p.file_path) {
        photosMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }

    clubModels = (modelProfiles ?? []).map((p: any) => ({
      ...p,
      ...(detailsMap.get(p.id) || {}),
      photoUrl: photosMap.get(p.id) || null,
    }))
  }

  const viewCountMap = await fetchViewCounts(admin, 'club', [id])
  const viewCount = viewCountMap.get(id) ?? 0

  const clubName = clubDetails?.display_name || clubDetails?.club_name || profile.username || 'Club'
  const clubImage = photosWithUrls[0]?.url || 'https://www.nicemodels.ch/logo.webp'
  const clubJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: clubName,
    url: `https://www.nicemodels.ch/clubs/${id}`,
    image: clubImage,
    ...(clubDetails?.about_description
      ? { description: String(clubDetails.about_description).replace(/<[^>]*>/g, '').slice(0, 300) }
      : {}),
    address: {
      '@type': 'PostalAddress',
      ...(contactDetails?.city ? { addressLocality: contactDetails.city } : {}),
      ...(contactDetails?.street ? { streetAddress: contactDetails.street } : {}),
      addressCountry: 'CH',
    },
    ...(contactDetails?.phone_number ? { telephone: contactDetails.phone_number } : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clubJsonLd) }}
      />
      <ClubProfileClient
        profile={profile}
        clubDetails={clubDetails}
        contactDetails={contactDetails}
        workingHours={workingHours}
        photos={photosWithUrls}
        clubModels={clubModels}
        viewCount={viewCount}
      />
    </>
  )
}
