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

export default function AreaAddressStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const swissRegions = {
    deutschchweiz: ['Basel', 'Glarus', 'Lucerne', 'Solothurn', 'Schwyz', 'Thurgau', 'Schaffhausen', 'Zug', 'Zürich (Surroundings)', 'Bern', 'Grisons', 'Aargau', 'Nidwalden / Obwalden', 'St. Gallen / Appenzell', 'Uri', 'Valais', 'Zürich (City)', 'Ticino'],
    romandie: ['Fribourg', 'Geneva', 'Jura', 'Neuchâtel', 'Vaud'],
  }

  const toggleRegion = (region: string) => {
    const updated = data.regions.includes(region)
      ? data.regions.filter(r => r !== region)
      : [...data.regions, region]
    updateData({ regions: updated })
  }

  const toggleAvailableFor = (option: string) => {
    const updated = data.availableFor.includes(option)
      ? data.availableFor.filter(o => o !== option)
      : [...data.availableFor, option]
    updateData({ availableFor: updated })
  }

  return (
    <div>
      {/* Pink Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={prevStep} />
            <h1 className="text-2xl font-bold">Area / Address</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h2 className="text-xl font-bold mb-4">
          Area / Address <span className="text-red-500">*</span>
        </h2>

        {/* Deutschschweiz */}
        <h3 className="font-semibold mb-3 mt-6">Deutschschweiz</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {swissRegions.deutschchweiz.map((region) => (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              className={`px-4 py-2 rounded-full border text-sm transition ${
                data.regions.includes(region)
                  ? 'bg-pink-100 border-pink-500 text-pink-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Romandie */}
        <h3 className="font-semibold mb-3 mt-6">Romandie</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {swissRegions.romandie.map((region) => (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              className={`px-4 py-2 rounded-full border text-sm transition ${
                data.regions.includes(region)
                  ? 'bg-pink-100 border-pink-500 text-pink-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Exact Location */}
        <h3 className="font-semibold mb-3 mt-8">Exact Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <select
              value={data.city}
              onChange={(e) => updateData({ city: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">City</option>
              <option value="zurich">Zürich</option>
              <option value="geneva">Geneva</option>
              <option value="basel">Basel</option>
              <option value="bern">Bern</option>
              <option value="lausanne">Lausanne</option>
              <option value="lucerne">Lucerne</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="ZIP"
              value={data.zip}
              onChange={(e) => updateData({ zip: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="displayAddress"
              checked={data.displayAddress}
              onChange={(e) => updateData({ displayAddress: e.target.checked })}
              className="w-5 h-5 text-pink-600"
            />
            <label htmlFor="displayAddress" className="text-sm cursor-pointer">
              Display address on website
            </label>
          </div>
        </div>

        {/* Address Details */}
        <h3 className="font-semibold mb-3 mt-8">Address Details</h3>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Club Name"
            value={data.clubName}
            onChange={(e) => updateData({ clubName: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Street"
              value={data.street}
              onChange={(e) => updateData({ street: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-xs text-gray-500 mt-1">Please use this field for the street name only!</p>
          </div>
          <div>
            <input
              type="text"
              placeholder="Nr."
              value={data.streetNumber}
              onChange={(e) => updateData({ streetNumber: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
        <div className="mb-6">
          <input
            type="text"
            placeholder="Additional info"
            value={data.additionalInfo}
            onChange={(e) => updateData({ additionalInfo: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            e.g. "private and discrete" / "only with appointment" / "second floor" etc.
          </p>
        </div>

        {/* Available For */}
        <h3 className="font-semibold mb-3 mt-8">Available For</h3>
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => toggleAvailableFor('Incall')}
            className={`px-6 py-2 rounded border transition ${
              data.availableFor.includes('Incall')
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            Incall
          </button>
          <button
            onClick={() => toggleAvailableFor('Outcall')}
            className={`px-6 py-2 rounded border transition ${
              data.availableFor.includes('Outcall')
                ? 'bg-pink-100 border-pink-500 text-pink-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
            }`}
          >
            Outcall
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

