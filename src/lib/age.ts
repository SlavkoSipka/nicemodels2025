/** Age in full years from an ISO date string (YYYY-MM-DD). */
export function ageFromDateOfBirth(dateString: string | null | undefined): number | null {
  if (!dateString) return null
  const birth = new Date(dateString)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}
