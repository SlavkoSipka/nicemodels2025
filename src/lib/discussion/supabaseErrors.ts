/** PostgREST: table missing from schema (migration not applied or cache stale). */
export function isDiscussionSchemaMissing(err: { code?: string; message?: string } | null): boolean {
  if (!err) return false
  const m = (err.message || '').toLowerCase()
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    m.includes('schema cache') ||
    m.includes('could not find the table') ||
    m.includes('relation') && m.includes('does not exist')
  )
}
