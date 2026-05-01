'use client'

import CreateJobRentForm from '@/components/jobs-rent/CreateJobRentForm'

export default function CompanyCreateJobRentPage() {
  return (
    <CreateJobRentForm
      backHref="/dashboard/company/jobs-rent"
      successHref="/dashboard/company/jobs-rent"
      subtitle="Post a new job or rent listing"
      prefillFromClubContact
      requireActiveAd
      activateAdHref="/dashboard/company/activate-ad"
    />
  )
}
