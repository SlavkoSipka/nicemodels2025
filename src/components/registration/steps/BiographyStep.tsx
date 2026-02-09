'use client'

import { ChevronLeft } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  nextStep: () => void
  currentStep: number
  totalSteps: number
}

export default function BiographyStep({ data, updateData, nextStep, currentStep, totalSteps }: Props) {
  const countries = [
    'Switzerland', 'Germany', 'Austria', 'France', 'Italy', 'Spain', 'Romania', 'Hungary',
    'Poland', 'Czech Republic', 'Bulgaria', 'Russia', 'Ukraine', 'Brazil', 'Colombia'
  ]

  const toggleCountry = (country: string) => {
    const updated = data.blockCountries.includes(country)
      ? data.blockCountries.filter(c => c !== country)
      : [...data.blockCountries, country]
    updateData({ blockCountries: updated })
  }

  return (
    <div>
      {/* Pink Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" />
            <h1 className="text-2xl font-bold">Biography</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <p className="mb-6 text-gray-700">
          To post your ad and enjoy all the options of your NiceModels account, please complete the form below.
          After filling in your info, click on the "Next Step" button.
          <br />
          Mandatory fields are marked with an <span className="text-red-500">*</span>.
        </p>

        {/* Basic BIO */}
        <h2 className="text-xl font-bold mb-4">Basic BIO</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">
              Showname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Name which will appear on your profile"
              value={data.showname}
              onChange={(e) => updateData({ showname: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Slogan</label>
            <input
              type="text"
              placeholder="Put here a slogan or keyword which describes you and/or your service the best."
              value={data.slogan}
              onChange={(e) => updateData({ slogan: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              value={data.gender}
              onChange={(e) => updateData({ gender: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="trans">Trans</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">Ethnicity</label>
            <select
              value={data.ethnicity}
              onChange={(e) => updateData({ ethnicity: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Ethnicity</option>
              <option value="caucasian">Caucasian</option>
              <option value="asian">Asian</option>
              <option value="latina">Latina</option>
              <option value="ebony">Ebony</option>
              <option value="arabic">Arabic</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Nationality</label>
            <select
              value={data.nationality}
              onChange={(e) => updateData({ nationality: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Nationality</option>
              <option value="swiss">Swiss</option>
              <option value="german">German</option>
              <option value="french">French</option>
              <option value="italian">Italian</option>
              <option value="spanish">Spanish</option>
              <option value="romanian">Romanian</option>
              <option value="hungarian">Hungarian</option>
              <option value="brazilian">Brazilian</option>
              <option value="colombian">Colombian</option>
              <option value="russian">Russian</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Age</label>
            <input
              type="number"
              placeholder="Age"
              value={data.age}
              onChange={(e) => updateData({ age: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        {/* Physical Features */}
        <h2 className="text-xl font-bold mb-4 mt-8">Physical Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">Hair Color</label>
            <select
              value={data.hairColor}
              onChange={(e) => updateData({ hairColor: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Hair Color</option>
              <option value="blonde">Blonde</option>
              <option value="brunette">Brunette</option>
              <option value="black">Black</option>
              <option value="red">Red</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Eye Color</label>
            <select
              value={data.eyeColor}
              onChange={(e) => updateData({ eyeColor: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Eye Color</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="brown">Brown</option>
              <option value="hazel">Hazel</option>
              <option value="gray">Gray</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">Height</label>
            <div className="flex">
              <input
                type="number"
                placeholder="Height"
                value={data.height}
                onChange={(e) => updateData({ height: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">cm</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Weight</label>
            <div className="flex">
              <input
                type="number"
                placeholder="Weight"
                value={data.weight}
                onChange={(e) => updateData({ weight: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">kg</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Dress Size</label>
            <select
              value={data.dressSize}
              onChange={(e) => updateData({ dressSize: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Dress Size</option>
              <option value="xs">XS</option>
              <option value="s">S</option>
              <option value="m">M</option>
              <option value="l">L</option>
              <option value="xl">XL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Shoe Size</label>
            <input
              type="number"
              placeholder="Shoe Size"
              value={data.shoeSize}
              onChange={(e) => updateData({ shoeSize: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">Bust</label>
            <div className="flex">
              <input
                type="number"
                placeholder="Bust"
                value={data.bust}
                onChange={(e) => updateData({ bust: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">cm</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Waist</label>
            <div className="flex">
              <input
                type="number"
                placeholder="Waist"
                value={data.waist}
                onChange={(e) => updateData({ waist: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">cm</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Hip</label>
            <div className="flex">
              <input
                type="number"
                placeholder="Hip"
                value={data.hip}
                onChange={(e) => updateData({ hip: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">cm</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">Cup Size</label>
            <select
              value={data.cupSize}
              onChange={(e) => updateData({ cupSize: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Cup Size</option>
              <option value="a">A</option>
              <option value="b">B</option>
              <option value="c">C</option>
              <option value="d">D</option>
              <option value="dd">DD</option>
              <option value="e">E</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-2">Pubic Hair</label>
          <select
            value={data.pubicHair}
            onChange={(e) => updateData({ pubicHair: e.target.value })}
            className="w-full md:w-1/3 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Pubic Hair</option>
            <option value="shaved">Shaved</option>
            <option value="trimmed">Trimmed</option>
            <option value="natural">Natural</option>
          </select>
        </div>

        {/* Additional Information */}
        <h2 className="text-xl font-bold mb-4 mt-8">Additional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">Smoking</label>
            <select
              value={data.smoking}
              onChange={(e) => updateData({ smoking: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Smoking</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="occasionally">Occasionally</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Drinking</label>
            <select
              value={data.drinking}
              onChange={(e) => updateData({ drinking: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Drinking</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="socially">Socially</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-2">Special Characteristics</label>
          <textarea
            placeholder="Please mention any special characteristics e.g. tattoos, piercings, etc."
            value={data.specialCharacteristics}
            onChange={(e) => updateData({ specialCharacteristics: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Block Countries */}
        <h2 className="text-xl font-bold mb-4 mt-8">Block Countries</h2>
        <p className="text-sm text-gray-700 mb-4">
          Here you can block or allow visitors from certain countries to access your profile.
          <br />
          If you want to block only a few countries and allow all the others, please use the "Block" option.
          <br />
          If you want to allow only a few countries and block all the others, then use the "Allow" option.
          <br />
          <strong>Switzerland cannot be blocked.</strong>
        </p>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => updateData({ blockMode: 'block' })}
            className={`px-6 py-2 rounded-full border-2 transition ${
              data.blockMode === 'block'
                ? 'border-pink-500 bg-pink-50 text-pink-600'
                : 'border-gray-300 text-gray-600 hover:border-pink-300'
            }`}
          >
            Block
          </button>
          <button
            onClick={() => updateData({ blockMode: 'allow' })}
            className={`px-6 py-2 rounded-full border-2 transition ${
              data.blockMode === 'allow'
                ? 'border-pink-500 bg-pink-50 text-pink-600'
                : 'border-gray-300 text-gray-600 hover:border-pink-300'
            }`}
          >
            Allow
          </button>
        </div>

        <div className="mb-6">
          <select className="w-full md:w-1/3 border border-gray-300 rounded px-3 py-2 mb-2">
            <option value="">Countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          <button className="ml-2 bg-white border-2 border-pink-500 text-pink-600 px-6 py-2 rounded hover:bg-pink-50 transition">
            ADD
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

