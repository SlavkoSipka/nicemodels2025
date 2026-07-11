import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import AdminClubEditClient from './AdminClubEditClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminClubEditPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const [
    { data: profile },
    { data: clubDetails },
    { data: contactDetails },
    { data: photos },
    { data: videos },
    { data: workingHours },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).eq('role', 'company').single(),
    admin.from('club_details').select('*').eq('club_id', id).single(),
    admin.from('club_contact_details').select('*').eq('club_id', id).single(),
    admin.from('club_photos').select('*').eq('club_id', id).order('display_order', { ascending: true }).order('uploaded_at', { ascending: false }),
    admin.from('club_videos').select('*').eq('club_id', id).order('uploaded_at', { ascending: false }),
    admin.from('club_working_hours').select('*').eq('club_id', id).order('day_of_week', { ascending: true }),
  ])

  if (!profile) notFound()

  // Ad packages the admin can grant, and the club's current ad status.
  const [{ data: adPackages }, { data: adItems }] = await Promise.all([
    admin
      .from('products')
      .select('id, name, duration_days, duration_hours, price_chf')
      .eq('product_type', 'ad_package')
      .eq('is_active', true)
      .order('display_order'),
    admin
      .from('order_items')
      .select('activation_date, orders!inner(user_id, status, created_at), products!inner(product_type, duration_days, duration_hours)')
      .eq('orders.user_id', id)
      .eq('orders.status', 'paid')
      .eq('products.product_type', 'ad_package'),
  ])

  const nowMs = Date.now()
  let currentAdExpiry: string | null = null
  for (const it of (adItems as any[]) || []) {
    const order = it.orders
    const product = it.products
    if (!order || !product) continue
    const start = it.activation_date ? new Date(it.activation_date) : new Date(order.created_at)
    const durationMs =
      Number(product.duration_days || 0) * 86400000 +
      Number(product.duration_hours || 0) * 3600000
    const expiry = new Date(start.getTime() + durationMs)
    if (start.getTime() <= nowMs && expiry.getTime() > nowMs) {
      currentAdExpiry = expiry.toISOString()
      break
    }
  }

  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <AdminClubEditClient
      clubId={id}
      profile={profile}
      clubDetails={clubDetails}
      contactDetails={contactDetails}
      photos={(photos || []).map((p: any) => ({
        ...p,
        url: p.file_path ? `${SUPA_URL}/storage/v1/object/public/club-photos/${p.file_path}` : null,
      }))}
      videos={(videos || []).map((v: any) => ({
        ...v,
        url: v.file_path ? `${SUPA_URL}/storage/v1/object/public/club-videos/${v.file_path}` : null,
      }))}
      workingHours={workingHours || []}
      adPackages={adPackages || []}
      currentAdExpiry={currentAdExpiry}
    />
  )
}
