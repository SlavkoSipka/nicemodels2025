import Link from 'next/link'
import { ChevronRight, IdCard, LayoutDashboard } from 'lucide-react'
import { HELP_PATH, HELP_TOPICS, helpUrl, type HelpIcon, type HelpTopic } from '@/lib/helpTopics'

export const HELP_ICONS: Record<HelpIcon, typeof IdCard> = {
  profile: IdCard,
  sedcard: LayoutDashboard,
}

/** Home › Hilfe › <current> — matches the BreadcrumbList JSON-LD on each page. */
export function HelpBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
        <li>
          <Link href="/" className="hover:text-brand transition-colors">
            Startseite
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="w-3 h-3" />
        </li>
        <li>
          <Link href={HELP_PATH} className="hover:text-brand transition-colors">
            Hilfe
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="w-3 h-3" />
        </li>
        <li className="font-semibold text-gray-700">{current}</li>
      </ol>
    </nav>
  )
}

export interface HelpStep {
  title: string
  body: string
  /** Optional in-app destination the step is talking about. */
  href?: string
  hrefLabel?: string
}

/** Numbered walkthrough — the backbone of every guide. */
export function HelpSteps({ steps }: { steps: HelpStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li
          key={step.title}
          className="relative rounded-xl border border-gray-200 bg-white p-5 pl-14"
        >
          <span className="absolute left-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {i + 1}
          </span>
          <h3 className="mb-1 text-sm font-bold text-gray-900">{step.title}</h3>
          <p className="text-sm leading-relaxed text-gray-600">{step.body}</p>
          {step.href ? (
            <Link
              href={step.href}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-hover transition-colors"
            >
              {step.hrefLabel ?? 'Öffnen'}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

export interface HelpFaq {
  q: string
  a: string
}

export function HelpFaqList({ faqs }: { faqs: HelpFaq[] }) {
  return (
    <div className="space-y-3">
      {faqs.map(f => (
        <details key={f.q} className="group rounded-xl border border-gray-200 bg-white p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-gray-900">
            {f.q}
            <span className="text-lg leading-none text-gray-400 transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.a}</p>
        </details>
      ))}
    </div>
  )
}

/** Links to the other guides, so a reader never dead-ends on an article. */
export function HelpRelated({ currentSlug }: { currentSlug: string }) {
  const others: HelpTopic[] = HELP_TOPICS.filter(t => t.slug !== currentSlug)
  if (others.length === 0) return null

  return (
    <div className="mt-12">
      <h2 className="mb-4 text-lg font-bold text-gray-900 sm:text-xl">Weitere Hilfe-Themen</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {others.map(topic => {
          const Icon = HELP_ICONS[topic.icon]
          return (
            <Link
              key={topic.slug}
              href={helpUrl(topic.slug)}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-brand/40"
            >
              <Icon className="mb-2 h-6 w-6 text-brand" />
              <h3 className="mb-1 text-sm font-bold text-gray-900 group-hover:text-brand transition-colors">
                {topic.short}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">{topic.description}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** Closing call to action, shared by both guides. */
export function HelpCta({
  title,
  text,
  href,
  label,
}: {
  title: string
  text: string
  href: string
  label: string
}) {
  return (
    <div className="mt-10 rounded-xl border border-brand/20 bg-brand/5 p-6 text-center">
      <h2 className="mb-2 text-base font-bold text-gray-900 sm:text-lg">{title}</h2>
      <p className="mb-4 text-sm text-gray-600">{text}</p>
      <Link
        href={href}
        className="inline-block rounded-lg bg-brand px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-hover"
      >
        {label}
      </Link>
    </div>
  )
}
