'use client'

import SimplifiedClubModelForm from './SimplifiedClubModelForm'

interface ClubModelOnboardingFormProps {
  clubId: string
}

export default function ClubModelOnboardingForm({ clubId }: ClubModelOnboardingFormProps) {
  return <SimplifiedClubModelForm clubId={clubId} />
}

