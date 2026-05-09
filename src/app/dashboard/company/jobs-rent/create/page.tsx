'use client'

import { useTranslations } from 'next-intl'
import CreateJobRentForm from '@/components/jobs-rent/CreateJobRentForm'

export default function CompanyCreateJobRentPage() {
  const t = useTranslations('dashboard.company.jobsRentList')
  return (
    <CreateJobRentForm
      backHref="/dashboard/company/jobs-rent"
      successHref="/dashboard/company/jobs-rent"
      subtitle={t('subtitle')}
      prefillFromClubContact
      requireActiveAd
      activateAdHref="/dashboard/company/activate-ad"
    />
  )
}
