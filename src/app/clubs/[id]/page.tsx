import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import ClubProfileClient from './ClubProfileClient'
import { cache } from 'react'
import { fetchViewCounts } from '@/lib/viewCounts'
import { buildBreadcrumbJsonLd } from '@/lib/seo'

interface PageProps {
  params: Promise<{ id: string }>
}

const getClubMeta = cache(async (id: string) => {
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const [{ data: club }, { data: photo }] = await Promise.all([
    admin
      .from('club_details')
      .select('club_name, display_name, area, about_description')
      .eq('club_id', id)
      .maybeSingle(),
    admin
      .from('club_photos')
      .select('file_path')
      .eq('club_id', id)
      .eq('is_approved', true)
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
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
    club.about_description?.replace(/<[^>]*>/g, '').slice(0, 155).trimEnd() ||
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
    alternates: {
      canonical: `https://nicemodels.ch/clubs/${id}`,
      languages: {
        'de-CH': `https://nicemodels.ch/clubs/${id}`,
        'x-default': `https://nicemodels.ch/clubs/${id}`,
      },
    },
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
    { data: workingHoursRows },
    { data: photos },
    { data: accepted },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).eq('role', 'company').single(),
    supabase.from('club_details').select('*').eq('club_id', id).single(),
    supabase.from('club_contact_details').select('*').eq('club_id', id).maybeSingle(),
    supabase.from('club_working_hours').select('*').eq('club_id', id),
    supabase.from('club_photos').select('*').eq('club_id', id).eq('is_approved', true).order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
    admin.from('club_invites').select('invited_model_id').eq('club_id', id).eq('status', 'accepted'),
  ])

  if (!profile) notFound()

  // club_working_hours is stored as one row per day (day_of_week, opens_at,
  // closes_at, is_closed). Fold it into the flat shape ClubProfileClient reads.
  const rows = workingHoursRows ?? []
  let workingHours: Record<string, string | boolean | null> | null = null
  if (rows.length > 0) {
    const hhmm = (v: string | null) => (v ? v.slice(0, 5) : null)
    const is24_7 = rows.length === 7 && rows.every(
      (r: any) => !r.is_closed && r.opens_at === '00:00:00' && r.closes_at === '23:59:59',
    )
    workingHours = { always_available: is24_7 }
    for (const r of rows as any[]) {
      const day = r.day_of_week
      workingHours[`${day}_open`] = r.is_closed ? null : hhmm(r.opens_at)
      workingHours[`${day}_close`] = r.is_closed ? null : hhmm(r.closes_at)
    }
  }

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
  const clubImage = photosWithUrls[0]?.url || 'https://nicemodels.ch/logo.webp'

  const openingHoursSpecification = rows.length > 0
    ? rows
        .filter((r) => !r.is_closed)
        .map((r) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${r.day_of_week.charAt(0).toUpperCase()}${r.day_of_week.slice(1)}`,
          opens: (r.opens_at as string).slice(0, 5),
          closes: (r.closes_at as string).slice(0, 5),
        }))
    : undefined

  const clubJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: clubName,
    url: `https://nicemodels.ch/clubs/${id}`,
    image: clubImage,
    ...(clubDetails?.about_description
      ? { description: String(clubDetails.about_description).replace(/<[^>]*>/g, '').slice(0, 300) }
      : {}),
    ...(contactDetails?.city || contactDetails?.street
      ? {
          address: {
            '@type': 'PostalAddress',
            ...(contactDetails?.city ? { addressLocality: contactDetails.city } : {}),
            ...(contactDetails?.street ? { streetAddress: contactDetails.street } : {}),
            addressCountry: 'CH',
          },
        }
      : {}),
    ...(contactDetails?.phone_number ? { telephone: contactDetails.phone_number } : {}),
    ...(openingHoursSpecification ? { openingHoursSpecification } : {}),
  }
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Startseite', path: '/' },
    { name: 'Clubs', path: '/clubs' },
    { name: clubName, path: `/clubs/${id}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clubJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
