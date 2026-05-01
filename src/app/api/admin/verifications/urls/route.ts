import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return profile?.role === 'admin' ? user : null
}

/**
 * Generate signed URLs for the verification documents using the
 * service-role client so storage RLS can't block admin reads.
 */
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { idCardPath, selfiePath, videoPath } = body || {}
  const admin = createAdminClient()
  const bucket = admin.storage.from('verification-documents')

  const [idCard, selfie, video] = await Promise.all([
    idCardPath ? bucket.createSignedUrl(idCardPath, 3600) : Promise.resolve({ data: null }),
    selfiePath ? bucket.createSignedUrl(selfiePath, 3600) : Promise.resolve({ data: null }),
    videoPath ? bucket.createSignedUrl(videoPath, 3600) : Promise.resolve({ data: null }),
  ])

  return NextResponse.json({
    idCardUrl: (idCard as any).data?.signedUrl || '',
    selfieUrl: (selfie as any).data?.signedUrl || '',
    videoUrl: (video as any).data?.signedUrl || '',
  })
}
