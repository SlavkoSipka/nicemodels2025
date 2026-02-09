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

export default function ContactDetailsStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const toggleMessenger = (messenger: 'viber' | 'whatsapp' | 'telegram') => {
    updateData({ [messenger]: !data[messenger] })
  }

  return (
    <div>
      {/* Pink Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={prevStep} />
            <h1 className="text-2xl font-bold">Contact Details</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Phone Number */}
        <h3 className="font-semibold mb-4">
          Phone Number <span className="text-red-500">*</span>
        </h3>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.showPhoneNumber}
              onChange={(e) => updateData({ showPhoneNumber: e.target.checked })}
              className="w-5 h-5 text-pink-600"
            />
            <span className="text-blue-600">Show phone number</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2">Country Code</label>
            <select
              value={data.countryCode}
              onChange={(e) => updateData({ countryCode: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="+41">Switzerland (+41)</option>
              <option value="+49">Germany (+49)</option>
              <option value="+43">Austria (+43)</option>
              <option value="+33">France (+33)</option>
              <option value="+39">Italy (+39)</option>
              <option value="+34">Spain (+34)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="Phone Number"
              value={data.phoneNumber}
              onChange={(e) => updateData({ phoneNumber: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Please provide the country calling code if you use a non-Swiss number
            </p>
          </div>
        </div>

        {/* Messengers */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => toggleMessenger('viber')}
            className={`px-6 py-2 rounded-full border transition ${
              data.viber
                ? 'bg-purple-100 border-purple-500 text-purple-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300'
            }`}
          >
            ✓ Viber
          </button>
          <button
            onClick={() => toggleMessenger('whatsapp')}
            className={`px-6 py-2 rounded-full border transition ${
              data.whatsapp
                ? 'bg-green-100 border-green-500 text-green-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
            }`}
          >
            ✓ WhatsApp
          </button>
          <button
            onClick={() => toggleMessenger('telegram')}
            className={`px-6 py-2 rounded-full border transition ${
              data.telegram
                ? 'bg-blue-100 border-blue-500 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-blue-300'
            }`}
          >
            ✓ Telegram
          </button>
        </div>

        {/* Instructions */}
        <h3 className="font-semibold mb-4 mt-8">Instructions</h3>
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => updateData({ contactInstructions: 'sms_and_call' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.contactInstructions === 'sms_and_call'
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            SMS and Call
          </button>
          <button
            onClick={() => updateData({ contactInstructions: 'sms_only' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.contactInstructions === 'sms_only'
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            SMS Only
          </button>
          <button
            onClick={() => updateData({ contactInstructions: 'no_sms' })}
            className={`px-6 py-2 rounded-full border transition ${
              data.contactInstructions === 'no_sms'
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            No SMS
          </button>
        </div>

        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.noWithheldNumbers}
              onChange={(e) => updateData({ noWithheldNumbers: e.target.checked })}
              className="w-5 h-5 text-pink-600"
            />
            <span>No Withheld Numbers</span>
          </label>
        </div>

        <div className="mb-6">
          <textarea
            placeholder="Other"
            value={data.contactInstructions === 'other' ? data.contactInstructions : ''}
            onChange={(e) => updateData({ contactInstructions: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Web */}
        <h3 className="font-semibold mb-4 mt-8">Web</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <input
              type="text"
              placeholder="Skype id"
              value={data.skypeId}
              onChange={(e) => updateData({ skypeId: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Videogirls url"
              value={data.videogirlsUrl}
              onChange={(e) => updateData({ videogirlsUrl: e.target.value })}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button className="bg-gray-800 text-white px-4 rounded hover:bg-gray-900 transition">
              vg
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <input
              type="email"
              placeholder="E-mail address"
              value={data.email}
              onChange={(e) => updateData({ email: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <input
              type="url"
              placeholder="Website"
              value={data.website}
              onChange={(e) => updateData({ website: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
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

