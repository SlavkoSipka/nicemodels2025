'use client'

import CreateJobRentForm from '@/components/jobs-rent/CreateJobRentForm'

export default function UserCreateJobRentPage() {
  return (
    <CreateJobRentForm
      backHref="/dashboard/user/jobs-rent"
      successHref="/dashboard/user/jobs-rent"
      subtitle="Post a job or rent listing — no profile required"
    />
  )
}
