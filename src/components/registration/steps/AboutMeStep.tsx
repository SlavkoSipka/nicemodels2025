'use client'

import { ChevronLeft } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  nextStep: () => void
  prevStep: () => void
  currentStep: number
  totalSteps: number
}

export default function AboutMeStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  return (
    <div>
      {/* Pink Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={prevStep} />
            <h1 className="text-2xl font-bold">About Me</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <p className="mb-6 text-gray-700">
          Describe yourself and write some additional information
        </p>

        <div className="mb-6">
          <label className="block text-sm mb-2">
            Describe yourself <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Describe yourself"
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            rows={10}
            maxLength={25000}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {data.description.length} / 25000
          </div>
        </div>

        {/* Text Formatting Buttons */}
        <div className="flex gap-2 mb-6">
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 font-bold">
            B
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 italic">
            I
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 underline">
            U
          </button>
        </div>

        {/* Next Step Button */}
        <button
          onClick={nextStep}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded font-semibold hover:from-pink-700 hover:to-pink-600 transition"
        >
          NEXT STEP
        </button>
      </div>
    </div>
  )
}

