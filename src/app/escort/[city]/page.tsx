import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildMetadata } from '@/lib/seo'
import { CITIES, getCityBySlug, type CityConfig } from '@/lib/data/cities-seo'
import ModelCard from '@/components/home/ModelCard'
import ClubCard, { type ClubCardData } from '@/components/home/ClubCard'

export const revalidate = 900

interface PageProps {
  params: Promise<{ city: string }>
}

export function generateStaticParams() {
  return CITIES.map(c => ({ city: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params
  const cfg = getCityBySlug(city)
  if (!cfg) return { title: 'Nicht gefunden' }
  return buildMetadata({
    path: `/escort/${cfg.slug}`,
    title: `Escort ${cfg.labelDe} – Verifizierte Models & Begleitung`,
    description: `Verifizierte Escort Models und Clubs in ${cfg.labelDe} (${cfg.canton}). Diskrete Begleitung auf NiceModels.ch – alle Profile geprüft.`,
  })
}

// ─── Data loading ────────────────────────────────────────────────────────────

interface ModelRow {
  id: string
  username: string
  photoUrl: string | null
  model_details: {
    showname: string
    city: string
    age: number
    ethnicity: string
    hair_color: string
    about_me?: string
    services_for?: string[]
  } | null
}

async function buildCityData(cfg: CityConfig) {
  const admin = createAdminClient()
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const [{ data: activeModelsRaw }, { data: activeClubsRaw }] = await Promise.all([
    admin.rpc('models_with_active_ads'),
    admin.rpc('clubs_with_active_ads'),
  ])

  const modelIds = ((activeModelsRaw ?? []) as { id: string }[]).map(m => m.id)
  const clubIds = ((activeClubsRaw ?? []) as { id: string }[]).map(c => c.id)

  const [modelsResult, clubsResult] = await Promise.all([
    modelIds.length > 0
      ? Promise.all([
          admin
            .from('model_details')
            .select('model_id, showname, city, age, ethnicity, hair_color, about_me, sedcard_visible')
            .in('model_id', modelIds)
            .eq('city', cfg.dbCityName)
            .neq('sedcard_visible', false)
            .limit(24),
          admin
            .from('profiles')
            .select('id, username')
            .in('id', modelIds)
            .eq('is_blocked', false),
        ])
      : Promise.resolve([{ data: [] }, { data: [] }]),
    clubIds.length > 0
      ? Promise.all([
          admin
            .from('club_details')
            .select('club_id, display_name, club_name, is_club, area, about_description')
            .in('club_id', clubIds)
            .eq('area', cfg.dbAreaName)
            .limit(12),
          admin
            .from('club_contact_details')
            .select('club_id, city')
            .in('club_id', clubIds),
        ])
      : Promise.resolve([{ data: [] }, { data: [] }]),
  ])

  const [{ data: detailRows }, { data: profileRows }] = modelsResult as [
    { data: any[] | null },
    { data: any[] | null },
  ]
  const [{ data: clubDetailRows }, { data: clubContactRows }] = clubsResult as [
    { data: any[] | null },
    { data: any[] | null },
  ]

  // ── Models ──
  const profileMap = new Map((profileRows ?? []).map((p: any) => [p.id, p]))
  const cityModelIds = (detailRows ?? [])
    .filter((d: any) => profileMap.has(d.model_id))
    .map((d: any) => d.model_id)

  let models: ModelRow[] = []
  if (cityModelIds.length > 0) {
    const { data: photoRows } = await admin
      .from('model_photos')
      .select('model_id, file_path')
      .in('model_id', cityModelIds)
      .eq('is_approved', true)
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })

    const photoMap = new Map<string, string>()
    for (const p of photoRows ?? []) {
      if (!photoMap.has(p.model_id) && p.file_path) {
        photoMap.set(p.model_id, `${SUPA_URL}/storage/v1/object/public/model-photos/${p.file_path}`)
      }
    }

    models = (detailRows ?? [])
      .filter((d: any) => profileMap.has(d.model_id))
      .map((d: any) => ({
        id: d.model_id,
        username: profileMap.get(d.model_id)?.username ?? '',
        photoUrl: photoMap.get(d.model_id) ?? null,
        model_details: {
          showname: d.showname,
          city: d.city,
          age: d.age,
          ethnicity: d.ethnicity,
          hair_color: d.hair_color,
          about_me: d.about_me ?? undefined,
        },
      }))
  }

  // ── Clubs ──
  const contactMap = new Map((clubContactRows ?? []).map((c: any) => [c.club_id, c]))
  const cityClubIds = (clubDetailRows ?? []).map((d: any) => d.club_id)

  let clubs: ClubCardData[] = []
  if (cityClubIds.length > 0) {
    const { data: clubPhotoRows } = await admin
      .from('club_photos')
      .select('club_id, file_path')
      .in('club_id', cityClubIds)
      .eq('is_approved', true)
      .order('display_order', { ascending: true })
      .order('uploaded_at', { ascending: false })

    const clubPhotoMap = new Map<string, string>()
    for (const p of clubPhotoRows ?? []) {
      if (!clubPhotoMap.has(p.club_id) && p.file_path) {
        clubPhotoMap.set(p.club_id, `${SUPA_URL}/storage/v1/object/public/club-photos/${p.file_path}`)
      }
    }

    clubs = (clubDetailRows ?? []).map((d: any) => ({
      id: d.club_id,
      display_name: d.display_name || d.club_name || '',
      area: d.area || '',
      city: contactMap.get(d.club_id)?.city || cfg.labelDe,
      is_club: d.is_club ?? true,
      description: (d.about_description ?? '').replace(/<[^>]*>/g, ''),
      photoUrl: clubPhotoMap.get(d.club_id) ?? null,
    }))
  }

  return { models, clubs }
}

function getCityData(cfg: CityConfig) {
  return unstable_cache(
    () => buildCityData(cfg),
    [`city-page-${cfg.slug}-v1`],
    { revalidate: 900, tags: [`city-${cfg.slug}`] },
  )()
}

// ─── Page ────────────────────────────────────────────────────────────────────

const SITE_URL = 'https://www.nicemodels.ch'

export default async function CityPage({ params }: PageProps) {
  const { city: citySlug } = await params
  const cfg = getCityBySlug(citySlug)
  if (!cfg) notFound()

  const { models, clubs } = await getCityData(cfg)

  const pageUrl = `${SITE_URL}/escort/${cfg.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Startseite', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Escort Schweiz', item: `${SITE_URL}/escort` },
          { '@type': 'ListItem', position: 3, name: `Escort ${cfg.labelDe}`, item: pageUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `Escort ${cfg.labelDe} – Verifizierte Models & Begleitung`,
        url: pageUrl,
        description: `Verifizierte Escort Models und Clubs in ${cfg.labelDe}.`,
        areaServed: { '@type': 'City', name: cfg.labelDe, addressCountry: 'CH' },
      },
    ],
  }

  const introParagraphs = cfg.introCopyDe.split('\n\n').filter(Boolean)

  return (
    <>
      <script
        id={`jsonld-city-${cfg.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto max-w-[1100px] px-3 sm:px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-gray-700">Startseite</Link>
          <span aria-hidden>›</span>
          <Link href="/escort" className="hover:text-gray-700">Escort Schweiz</Link>
          <span aria-hidden>›</span>
          <span className="text-gray-700">Escort {cfg.labelDe}</span>
        </nav>

        {/* Hero + intro copy */}
        <div className="rounded-xl bg-white/70 px-4 py-4 sm:px-5 sm:py-5 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            Escort {cfg.labelDe} – Verifizierte Models & Begleitung
          </h1>
          <div className="mt-2 space-y-2">
            {introParagraphs.map((para, i) => (
              <p
                key={i}
                className={i === 0 ? 'text-sm font-medium text-gray-700 leading-relaxed' : 'text-sm text-gray-600 leading-relaxed'}
              >
                {para}
              </p>
            ))}
          </div>
        </div>

        {/* Models section */}
        <section aria-labelledby="models-heading" className="mb-8">
          <h2 id="models-heading" className="text-lg font-bold text-gray-900 mb-3">
            Escort Models in {cfg.labelDe}
          </h2>
          {models.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {models.map((model, i) => (
                <ModelCard key={model.id} model={model as any} priority={i < 4} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white/70 px-4 py-8 text-center">
              <p className="text-gray-500 text-sm">
                Bald verfügbar in {cfg.labelDe} — neue Profile werden laufend hinzugefügt.
              </p>
              <Link
                href="/models-page"
                className="mt-3 inline-block text-sm font-medium text-pink-600 hover:underline"
              >
                Alle Models in der Schweiz ansehen →
              </Link>
            </div>
          )}
        </section>

        {/* Clubs section */}
        <section aria-labelledby="clubs-heading" className="mb-8">
          <h2 id="clubs-heading" className="text-lg font-bold text-gray-900 mb-3">
            Clubs & Agenturen in {cfg.labelDe}
          </h2>
          {clubs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clubs.map((club, i) => (
                <ClubCard key={club.id} club={club} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white/70 px-4 py-8 text-center">
              <p className="text-gray-500 text-sm">
                Bald verfügbar in {cfg.labelDe} — Club-Profile werden laufend hinzugefügt.
              </p>
              <Link
                href="/clubs"
                className="mt-3 inline-block text-sm font-medium text-pink-600 hover:underline"
              >
                Alle Clubs in der Schweiz ansehen →
              </Link>
            </div>
          )}
        </section>

        {/* Related cities */}
        <section aria-labelledby="related-heading" className="mb-8">
          <h2 id="related-heading" className="text-base font-bold text-gray-900 mb-3">
            Escort in weiteren Schweizer Städten
          </h2>
          <div className="flex flex-wrap gap-2">
            {cfg.relatedCitySlugs.map(slug => {
              const related = getCityBySlug(slug)
              if (!related) return null
              return (
                <Link
                  key={slug}
                  href={`/escort/${slug}`}
                  className="rounded-lg bg-white/70 hover:bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Escort {related.labelDe}
                </Link>
              )
            })}
            <Link
              href="/escort"
              className="rounded-lg bg-white/70 hover:bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Alle Städte
            </Link>
            <Link
              href="/models-page"
              className="rounded-lg bg-white/70 hover:bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Alle Models in der Schweiz
            </Link>
            <Link
              href="/clubs"
              className="rounded-lg bg-white/70 hover:bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Alle Clubs
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
