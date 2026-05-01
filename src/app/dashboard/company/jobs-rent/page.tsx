'use client'

import CreateJobRentForm from '@/components/jobs-rent/CreateJobRentForm'

export default function CompanyJobsRentPage() {
  return (
    <CreateJobRentForm
      backHref="/dashboard/company"
      successHref="/dashboard/company"
      subtitle="Post a new job or rent listing"
      prefillFromClubContact
    />
  )
}
