'use client'

import { useTranslations } from 'next-intl'
import CreateJobRentForm from '@/components/jobs-rent/CreateJobRentForm'

export default function UserCreateJobRentPage() {
  const t = useTranslations('dashboard.user.jobsRentCreate')
  return (
    <CreateJobRentForm
      backHref="/dashboard/user/jobs-rent"
      successHref="/dashboard/user/jobs-rent"
      subtitle={t('subtitle')}
    />
  )
}
