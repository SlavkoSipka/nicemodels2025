import { redirect } from 'next/navigation'

// Contact details has been merged into Basic Info.
// Keep this route alive but redirect to avoid broken bookmarks.
export default function ContactDetailsRedirect() {
  redirect('/dashboard/company/profile/basic-info')
}
