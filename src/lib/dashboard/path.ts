/**
 * Resolve the dashboard root path for a given profile role.
 *
 * Visitors (role = 'user') and unknown / NULL roles default to the
 * `/dashboard/user` surface so post-payment redirects (success / cancel)
 * never send them into the model dashboard by accident.
 */
export function dashboardRootForRole(role: string | null | undefined): string {
  if (role === 'model') return '/dashboard/model'
  if (role === 'company') return '/dashboard/company'
  return '/dashboard/user'
}
