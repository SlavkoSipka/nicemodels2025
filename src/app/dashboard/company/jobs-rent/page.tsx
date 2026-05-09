'use client'

import { useTranslations } from 'next-intl'
import CreateJobRentForm from '@/components/jobs-rent/CreateJobRentForm'

export default function CompanyJobsRentPage() {
  const t = useTranslations('dashboard.company.jobsRentList')
  return (
    <CreateJobRentForm
      backHref="/dashboard/company"
      successHref="/dashboard/company"
      subtitle={t('subtitle')}
      prefillFromClubContact
    />
  )
}
