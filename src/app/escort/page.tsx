import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { CITIES } from '@/lib/data/cities-seo'

export const metadata = buildMetadata({
  path: '/escort',
  title: 'Escort Schweiz – Städteübersicht',
  description: 'Verifizierte Escort Models in allen grossen Schweizer Städten. Zürich, Bern, Basel, Genf, Luzern und mehr auf NiceModels.ch.',
})

const CANTON_LABELS: Record<string, string> = {
  ZH: 'Kt. Zürich', BE: 'Kt. Bern', BS: 'Kt. Basel-Stadt',
  GE: 'Kt. Genf', VD: 'Kt. Waadt', LU: 'Kt. Luzern',
  ZG: 'Kt. Zug', SG: 'Kt. St. Gallen', TI: 'Kt. Tessin',
}

export default function EscortIndexPage() {
  return (
    <main className="mx-auto max-w-[1100px] px-3 sm:px-4 py-4 sm:py-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
        <Link href="/" className="hover:text-gray-700">Startseite</Link>
        <span>›</span>
        <span className="text-gray-700">Escort Schweiz</span>
      </nav>

      <div className="rounded-xl bg-white/70 px-4 py-4 sm:px-5 sm:py-5 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
          Escort Schweiz – Alle Städte
        </h1>
        <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
          Verifizierte Escort Models und Clubs in den grössten Schweizer Städten. Wähle eine Stadt und entdecke aktive Profile in deiner Nähe.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {CITIES.map(city => (
          <Link
            key={city.slug}
            href={`/escort/${city.slug}`}
            className="group rounded-xl bg-white/70 hover:bg-white px-4 py-4 flex items-center justify-between transition-colors"
          >
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                Escort {city.labelDe}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{CANTON_LABELS[city.canton] ?? city.canton}</p>
            </div>
            <span className="text-gray-400 group-hover:text-pink-500 text-lg leading-none">›</span>
          </Link>
        ))}
      </div>

      <div className="rounded-xl bg-white/70 px-4 py-4 sm:px-5">
        <p className="text-sm text-gray-600 leading-relaxed">
          Alle Profile auf NiceModels.ch werden vor der Veröffentlichung geprüft. Du siehst ausschliesslich aktive, echte Inserate – keine veralteten Einträge.
          Neben Escort Models findest du auch{' '}
          <Link href="/clubs" className="text-pink-600 hover:underline">Clubs & Agenturen</Link> und{' '}
          <Link href="/models-page" className="text-pink-600 hover:underline">alle Models schweizweit</Link>.
        </p>
      </div>
    </main>
  )
}
