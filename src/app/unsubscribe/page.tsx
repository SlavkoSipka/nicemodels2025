import Link from 'next/link'
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

const CATEGORY_LABEL: Record<string, string> = {
  admin_actions: 'Admin actions',
  verification: 'Verification updates',
  purchase: 'Payment & advertising',
  engagement: 'Messages, comments and invites',
  fav_digest: 'Favorite updates digest',
  saved_search_alerts: 'Saved search alerts',
  reports: 'Reports updates',
  all: 'All optional emails',
}

// 30 days validity for an unsubscribe link
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const { u, c, t, sig } = params

  if (!u || !c || !t || !sig) {
    return <Layout heading="Invalid link">The unsubscribe link is incomplete.</Layout>
  }

  if (!VALID_CATEGORIES.has(c)) {
    return <Layout heading="Invalid link">Unknown email category.</Layout>
  }

  const issuedAt = Number(t)
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > MAX_AGE_MS) {
    return (
      <Layout heading="Link expired">
        This unsubscribe link has expired. Manage email preferences from your dashboard or contact us.
      </Layout>
    )
  }

  const valid = verifyUnsubscribeSignature({ u, c, t, sig })
  if (!valid) {
    return <Layout heading="Invalid link">The unsubscribe link could not be verified.</Layout>
  }

  const admin = createAdminClient()
  await admin
    .from('email_unsubscribes')
    .upsert(
      { user_id: u, category: c, source: 'email_link' },
      { onConflict: 'user_id,category' },
    )

  return (
    <Layout heading="You are unsubscribed">
      <p>
        We will no longer send you the <strong>{CATEGORY_LABEL[c]}</strong> emails. Mandatory account-status
        notices (such as block / unblock / delete) will still be delivered.
      </p>
      <p style={{ marginTop: 16 }}>
        Changed your mind? <Link href="/login" style={{ color: '#ec4899' }}>Sign in</Link> and
        re-enable from your dashboard, or write to <a href="mailto:info@nicemodels.ch" style={{ color: '#ec4899' }}>info@nicemodels.ch</a>.
      </p>
    </Layout>
  )
}

function Layout({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fce9f3', padding: '48px 16px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', background: '#fff', borderRadius: 14, padding: 32, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <h1 style={{ margin: '0 0 14px', fontSize: 22, color: '#1a1a2e' }}>{heading}</h1>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#475569' }}>{children}</div>
        <p style={{ marginTop: 24, fontSize: 12, color: '#94a3b8' }}>
          <Link href="/" style={{ color: '#94a3b8' }}>← Back to NiceModels.ch</Link>
        </p>
      </div>
    </div>
  )
}
