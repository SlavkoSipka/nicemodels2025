'use client'

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
      {/* Pink Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={prevStep} />
            <h1 className="text-2xl font-bold">Pictures / Video</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Photo Requirements */}
        <h3 className="font-semibold mb-3">Requirements</h3>
        <ul className="list-disc list-inside mb-6 space-y-1 text-gray-700">
          <li>Good quality photos.</li>
          <li>Photo without sexually explicit content.</li>
          <li>400 x 600 px for portrait images.</li>
          <li>500 x 375 px for landscape images.</li>
        </ul>

        {/* Upload Photo Button */}
        <input
          type="file"
          ref={photoInputRef}
          onChange={handlePhotoUpload}
          accept="image/*"
          multiple
          className="hidden"
        />
        <button
          onClick={() => photoInputRef.current?.click()}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded font-semibold hover:from-pink-700 hover:to-pink-600 transition flex items-center gap-2 mb-4"
        >
          <Upload className="w-5 h-5" />
          UPLOAD PHOTO
        </button>

        {data.photos.length > 0 ? (
          <div className="mb-6">
            <p className="text-green-600 font-semibold">{data.photos.length} photo(s) selected</p>
          </div>
        ) : (
          <p className="text-gray-500 italic mb-6">Your gallery is empty</p>
        )}

        {/* Archived Photos */}
        <h3 className="font-semibold mb-3">Archived Photos</h3>
        <p className="text-gray-500 italic mb-8">Your gallery is empty</p>

        {/* Video Section */}
        <h3 className="font-semibold mb-3">Video</h3>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-900">
            Showing a video in your sedcard makes you unique and spices your profile up!
            Even a short and simple video taken by smartphone will raise the number of visitors on your profile.
          </p>
        </div>

        {/* Video Requirements */}
        <h4 className="font-semibold mb-3">Requirements</h4>
        <ul className="list-disc list-inside mb-6 space-y-1 text-gray-700">
          <li>Video Max size is 200mb</li>
          <li>Allowed video formats: MP4, MOV, WMV, FLV, AVI, MKV</li>
          <li>Explicit nudity is not allowed</li>
          <li>Min video height is 360px</li>
        </ul>

        {/* Upload Video Button */}
        <input
          type="file"
          ref={videoInputRef}
          onChange={handleVideoUpload}
          accept="video/mp4,video/mov,video/wmv,video/x-flv,video/avi,video/x-matroska"
          multiple
          className="hidden"
        />
        <button
          onClick={() => videoInputRef.current?.click()}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded font-semibold hover:from-pink-700 hover:to-pink-600 transition flex items-center gap-2 mb-6"
        >
          <Upload className="w-5 h-5" />
          UPLOAD VIDEOS
        </button>

        {data.videos.length > 0 && (
          <div className="mb-6">
            <p className="text-green-600 font-semibold">{data.videos.length} video(s) selected</p>
          </div>
        )}

        {/* Finish Button */}
        <button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-12 py-4 rounded font-bold text-lg hover:from-pink-700 hover:to-pink-600 transition shadow-lg"
        >
          FINISH
        </button>

        <p className="text-sm text-gray-600 mt-4">
          By clicking "FINISH", you confirm that all information provided is accurate and you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

