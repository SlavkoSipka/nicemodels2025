'use client'

import { useState } from 'react'
import BiographyStep from './steps/BiographyStep'
import AboutMeStep from './steps/AboutMeStep'
import LanguagesStep from './steps/LanguagesStep'
import AreaAddressStep from './steps/AreaAddressStep'
import ServicesStep from './steps/ServicesStep'
import WorkingHoursStep from './steps/WorkingHoursStep'
import RatesStep from './steps/RatesStep'
import ContactDetailsStep from './steps/ContactDetailsStep'
import PicturesVideoStep from './steps/PicturesVideoStep'

export interface RegistrationData {
  // Biography
  showname: string
  slogan: string
  gender: string
  ethnicity: string
  nationality: string
  age: string
  hairColor: string
  eyeColor: string
  height: string
  weight: string
  dressSize: string
  shoeSize: string
  bust: string
  waist: string
  hip: string
  cupSize: string
  pubicHair: string
  smoking: string
  drinking: string
  specialCharacteristics: string
  blockCountries: string[]
  blockMode: 'block' | 'allow'
  
  // About Me
  description: string
  
  // Languages
  languages: Array<{ language: string; level: string }>
  
  // Area/Address
  regions: string[]
  city: string
  zip: string
  displayAddress: boolean
  clubName: string
  street: string
  streetNumber: string
  additionalInfo: string
  availableFor: string[]
  
  // Services
  sexualOrientation: string
  servicesFor: string[]
  mainServices: string[]
  extraServices: string[]
  fetishServices: string[]
  virtualServices: string[]
  massageServices: string[]
  
  // Working Hours
  workingHoursType: 'custom' | 'same' | '24/7'
  customSchedule?: any
  showAsNightEscort: boolean
  
  // Rates
  incallRates: Array<{ duration: string; price: string; currency: string }>
  outcallRates: Array<{ duration: string; price: string; currency: string }>
  
  // Contact Details
  phoneNumber: string
  countryCode: string
  showPhoneNumber: boolean
  viber: boolean
  whatsapp: boolean
  telegram: boolean
  contactInstructions: string
  noWithheldNumbers: boolean
  skypeId: string
  videogirlsUrl: string
  email: string
  website: string
  
  // Pictures/Video
  photos: File[]
  videos: File[]
}

export default function ModelRegistrationWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<RegistrationData>({
    showname: '',
    slogan: '',
    gender: '',
    ethnicity: '',
    nationality: '',
    age: '',
    hairColor: '',
    eyeColor: '',
    height: '',
    weight: '',
    dressSize: '',
    shoeSize: '',
    bust: '',
    waist: '',
    hip: '',
    cupSize: '',
    pubicHair: '',
    smoking: '',
    drinking: '',
    specialCharacteristics: '',
    blockCountries: [],
    blockMode: 'block',
    description: '',
    languages: [],
    regions: [],
    city: '',
    zip: '',
    displayAddress: false,
    clubName: '',
    street: '',
    streetNumber: '',
    additionalInfo: '',
    availableFor: [],
    sexualOrientation: '',
    servicesFor: [],
    mainServices: [],
    extraServices: [],
    fetishServices: [],
    virtualServices: [],
    massageServices: [],
    workingHoursType: '24/7',
    showAsNightEscort: false,
    incallRates: [],
    outcallRates: [],
    phoneNumber: '',
    countryCode: '+41',
    showPhoneNumber: true,
    viber: false,
    whatsapp: false,
    telegram: false,
    contactInstructions: '',
    noWithheldNumbers: false,
    skypeId: '',
    videogirlsUrl: '',
    email: '',
    website: '',
    photos: [],
    videos: [],
  })

  const totalSteps = 9

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      window.scrollTo(0, 0)
    }
  }

  const updateFormData = (data: Partial<RegistrationData>) => {
    setFormData({ ...formData, ...data })
  }

  const handleSubmit = async () => {
    console.log('Submitting registration:', formData)
    // TODO: Submit to Supabase
    alert('Registration completed! (Backend integration pending)')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Step Content */}
      {currentStep === 1 && (
        <BiographyStep
          data={formData}
          updateData={updateFormData}
          nextStep={nextStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      {currentStep === 2 && (
        <AboutMeStep
          data={formData}
          updateData={updateFormData}
          nextStep={nextStep}
          prevStep={prevStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      {currentStep === 3 && (
        <LanguagesStep
          data={formData}
          updateData={updateFormData}
          nextStep={nextStep}
          prevStep={prevStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      {currentStep === 4 && (
        <AreaAddressStep
          data={formData}
          updateData={updateFormData}
          nextStep={nextStep}
          prevStep={prevStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      {currentStep === 5 && (
        <ServicesStep
          data={formData}
          updateData={updateFormData}
          nextStep={nextStep}
          prevStep={prevStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      {currentStep === 6 && (
        <WorkingHoursStep
          data={formData}
          updateData={updateFormData}
          nextStep={nextStep}
          prevStep={prevStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      {currentStep === 7 && (
        <RatesStep
          data={formData}
          updateData={updateFormData}
          nextStep={nextStep}
          prevStep={prevStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      {currentStep === 8 && (
        <ContactDetailsStep
          data={formData}
          updateData={updateFormData}
          nextStep={nextStep}
          prevStep={prevStep}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      {currentStep === 9 && (
        <PicturesVideoStep
          data={formData}
          updateData={updateFormData}
          prevStep={prevStep}
          handleSubmit={handleSubmit}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
    </div>
  )
}

