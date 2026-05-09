import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyUnsubscribeSignature } from '@/lib/email/unsubscribe'

interface SearchParams {
  u?: string
  c?: string
  t?: string
  sig?: string
}

const VALID_CATEGORIES = new Set([
  'admin_actions','verification','purchase','engagement',
  'fav_digest','saved_search_alerts','reports','all',
])

const CATEGORY_KEY: Record<string, string> = {
  admin_actions: 'catAdminActions',
  verification: 'catVerification',
  purchase: 'catPurchase',
  engagement: 'catEngagement',
  fav_digest: 'catFavDigest',
  saved_search_alerts: 'catSavedSearchAlerts',
  reports: 'catReports',
  all: 'catAll',
}

const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { u, c, t, sig } = params
  const tr = await getTranslations('publicPages.unsubscribe')

  if (!u || !c || !t || !sig) {
    return <Layout heading={tr('invalidLink')}>{tr('incompleteLink')}</Layout>
  }

  if (!VALID_CATEGORIES.has(c)) {
    return <Layout heading={tr('invalidLink')}>{tr('unknownCategory')}</Layout>
  }

  const issuedAt = Number(t)
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MAX_AGE_MS) {
    return (
      <Layout heading={tr('linkExpired')}>
        {tr('linkExpiredDesc')}
      </Layout>
    )
  }

  const valid = verifyUnsubscribeSignature({ u, c, t, sig })
  if (!valid) {
    return <Layout heading={tr('invalidLink')}>{tr('couldNotVerify')}</Layout>
  }

  const admin = createAdminClient()
  await admin
    .from('email_unsubscribes')
    .upsert(
      { user_id: u, category: c, source: 'email_link' },
      { onConflict: 'user_id,category' },
    )

  return (
    <Layout heading={tr('youAreUnsubscribed')}>
      <p>
        {tr.rich('noLongerSend', {
          category: tr(CATEGORY_KEY[c] as any),
          bold: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
      <p style={{ marginTop: 16 }}>
        {tr.rich('changedMind', {
          signin: (chunks) => <Link href="/login" style={{ color: '#ec4899' }}>{chunks}</Link>,
          email: (chunks) => <a href="mailto:info@nicemodels.ch" style={{ color: '#ec4899' }}>{chunks}</a>,
        })}
      </p>
    </Layout>
  )
}

async function Layout({ heading, children }: { heading: string; children: React.ReactNode }) {
  const tr = await getTranslations('publicPages.unsubscribe')
  return (
    <div style={{ minHeight: '100vh', background: '#fce9f3', padding: '48px 16px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h1 style={{ margin: '0 0 14px', fontSize: 22, color: '#1a1a2e' }}>{heading}</h1>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#475569' }}>{children}</div>
        <p style={{ marginTop: 24, fontSize: 12, color: '#94a3b8' }}>
          <Link href="/" style={{ color: '#94a3b8' }}>{tr('backToHome')}</Link>
        </p>
      </div>
    </div>
  )
}
