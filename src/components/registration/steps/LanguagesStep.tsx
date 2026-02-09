'use client'

import { ChevronLeft } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'
import { useState } from 'react'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  nextStep: () => void
  prevStep: () => void
  currentStep: number
  totalSteps: number
}

export default function LanguagesStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('basic')

  const languages = [
    'English', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Spanish',
    'Arabic', 'Chinese', 'Dutch', 'Greek', 'Hungarian', 'Japanese', 'Polish', 'Romanian', 'Turkish'
  ]

  const addLanguage = () => {
    if (selectedLanguage) {
      const newLanguages = [...data.languages, { language: selectedLanguage, level: selectedLevel }]
      updateData({ languages: newLanguages })
      setSelectedLanguage('')
      setSelectedLevel('basic')
    }
  }

  const removeLanguage = (index: number) => {
    const newLanguages = data.languages.filter((_, i) => i !== index)
    updateData({ languages: newLanguages })
  }

  return (
    <div>
      {/* Pink Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={prevStep} />
            <h1 className="text-2xl font-bold">Languages</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <p className="mb-6 text-gray-700">
          Select the language you speak, click "Add" and choose your level.
        </p>

        <div className="mb-6">
          <label className="block text-sm mb-2">Languages</label>
          <div className="flex gap-2 items-center">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 max-w-xs"
            >
              <option value="">Select language</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <button
              onClick={addLanguage}
              className="bg-white border-2 border-pink-500 text-pink-600 px-6 py-2 rounded font-semibold hover:bg-pink-50 transition"
            >
              ADD
            </button>
          </div>
        </div>

        {/* Level Selection */}
        {selectedLanguage && (
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <label className="block text-sm mb-2">Level for {selectedLanguage}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="basic"
                  checked={selectedLevel === 'basic'}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-pink-600"
                />
                <span>Basic</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="intermediate"
                  checked={selectedLevel === 'intermediate'}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-pink-600"
                />
                <span>Intermediate</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="fluent"
                  checked={selectedLevel === 'fluent'}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-pink-600"
                />
                <span>Fluent</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="native"
                  checked={selectedLevel === 'native'}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-pink-600"
                />
                <span>Native</span>
              </label>
            </div>
          </div>
        )}

        {/* Added Languages List */}
        {data.languages.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Your Languages:</h3>
            <div className="space-y-2">
              {data.languages.map((lang, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span>
                    {lang.language} - <span className="text-gray-600 capitalize">{lang.level}</span>
                  </span>
                  <button
                    onClick={() => removeLanguage(index)}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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

