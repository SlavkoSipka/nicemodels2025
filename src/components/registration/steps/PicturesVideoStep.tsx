'use client'

import { useTranslations } from 'next-intl'
import { ChevronLeft, Upload } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'
import { useRef } from 'react'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  prevStep: () => void
  handleSubmit: () => void
  currentStep: number
  totalSteps: number
}

export default function PicturesVideoStep({ data, updateData, prevStep, handleSubmit, currentStep, totalSteps }: Props) {
  const t = useTranslations('components.modelRegistration.picturesVideo')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      updateData({ photos: [...data.photos, ...filesArray] })
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      updateData({ videos: [...data.videos, ...filesArray] })
    }
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={prevStep} />
            <h1 className="text-2xl font-bold">{t('title')}</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h3 className="font-semibold mb-3">{t('requirements')}</h3>
        <ul className="list-disc list-inside mb-6 space-y-1 text-gray-700">
          <li>{t('req1')}</li>
          <li>{t('req2')}</li>
          <li>{t('req3')}</li>
          <li>{t('req4')}</li>
        </ul>

        <input
          type="file"
          ref={photoInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded font-semibold hover:from-pink-700 hover:to-pink-600 transition flex items-center gap-2 mb-4"
        >
          <Upload className="w-5 h-5" />
          {t('uploadPhoto')}
        </button>

        {data.photos.length > 0 ? (
          <div className="mb-6">
            <p className="text-green-600 font-semibold">{t('photosSelected', { count: data.photos.length })}</p>
          </div>
        ) : (
          <p className="text-gray-500 italic mb-6">{t('galleryEmpty')}</p>
        )}

        <h3 className="font-semibold mb-3">{t('archivedPhotos')}</h3>
        <p className="text-gray-500 italic mb-8">{t('galleryEmpty')}</p>

        <h3 className="font-semibold mb-3">{t('video')}</h3>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-900">{t('videoPromo')}</p>
        </div>

        <h4 className="font-semibold mb-3">{t('videoReqTitle')}</h4>
        <ul className="list-disc list-inside mb-6 space-y-1 text-gray-700">
          <li>{t('vreq1')}</li>
          <li>{t('vreq2')}</li>
          <li>{t('vreq3')}</li>
          <li>{t('vreq4')}</li>
        </ul>

        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoUpload}
          accept="video/mp4,video/mov,video/wmv,video/x-flv,video/avi,video/x-matroska"
          multiple
          className="hidden"
        />
        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded font-semibold hover:from-pink-700 hover:to-pink-600 transition flex items-center gap-2 mb-6"
        >
          <Upload className="w-5 h-5" />
          {t('uploadVideos')}
        </button>

        {data.videos.length > 0 && (
          <div className="mb-6">
            <p className="text-green-600 font-semibold">{t('videosSelected', { count: data.videos.length })}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-12 py-4 rounded font-bold text-lg hover:from-pink-700 hover:to-pink-600 transition shadow-lg"
        >
          {t('finish')}
        </button>

        <p className="text-sm text-gray-600 mt-4">{t('finishLegal')}</p>
      </div>
    </div>
  )
}
