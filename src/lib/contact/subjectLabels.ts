/** Values match <select> option values on /contact */
export const CONTACT_SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  model: 'Model Registration',
  club: 'Club/Agency Registration',
  verification: 'Account Verification',
  technical: 'Technical Support',
  billing: 'Billing & Payments',
  report: 'Report an Issue',
  other: 'Other',
}

export function contactSubjectLabel(key: string): string {
  return CONTACT_SUBJECT_LABELS[key] ?? key
}
