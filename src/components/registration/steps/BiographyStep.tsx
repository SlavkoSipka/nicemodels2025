'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft } from 'lucide-react'
import { RegistrationData } from '../ModelRegistrationWizard'

interface Props {
  data: RegistrationData
  updateData: (data: Partial<RegistrationData>) => void
  nextStep: () => void
  currentStep: number
  totalSteps: number
}

const BLOCK_COUNTRY_ENTRIES: { value: string; msgKey: string }[] = [
  { value: 'Switzerland', msgKey: 'switzerland' },
  { value: 'Germany', msgKey: 'germany' },
  { value: 'Austria', msgKey: 'austria' },
  { value: 'France', msgKey: 'france' },
  { value: 'Italy', msgKey: 'italy' },
  { value: 'Spain', msgKey: 'spain' },
  { value: 'Romania', msgKey: 'romania' },
  { value: 'Hungary', msgKey: 'hungary' },
  { value: 'Poland', msgKey: 'poland' },
  { value: 'Czech Republic', msgKey: 'czechRepublic' },
  { value: 'Bulgaria', msgKey: 'bulgaria' },
  { value: 'Russia', msgKey: 'russia' },
  { value: 'Ukraine', msgKey: 'ukraine' },
  { value: 'Brazil', msgKey: 'brazil' },
  { value: 'Colombia', msgKey: 'colombia' },
]

export default function BiographyStep({ data, updateData, nextStep, currentStep, totalSteps }: Props) {
  const tb = useTranslations('dashboard.model.biography')
  const tc = useTranslations('dashboard.model.common')
  const tr = useTranslations('components.modelRegistration.biography')
  const tRoot = useTranslations('components.modelRegistration.common')
  const [pendingCountry, setPendingCountry] = useState('')

  const countries = useMemo(
    () =>
      BLOCK_COUNTRY_ENTRIES.map(({ value, msgKey }) => ({
        value,
        label: tr(`countries.${msgKey}` as any),
      })),
    [tr]
  )

  const addCountry = () => {
    if (!pendingCountry || data.blockCountries.includes(pendingCountry)) return
    updateData({ blockCountries: [...data.blockCountries, pendingCountry] })
    setPendingCountry('')
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" />
            <h1 className="text-2xl font-bold">{tr('headerTitle')}</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <p className="mb-2 text-gray-700">{tr('intro1')}</p>
        <p className="mb-4 text-gray-700">{tr('intro2')}</p>
        <p className="mb-6 text-gray-700">
          {tb('subtitle')} <span className="text-red-500">*</span>
        </p>

        <h2 className="text-xl font-bold mb-4">{tb('basicBio')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">
              {tb('showname')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={tr('shownamePh')}
              value={data.showname}
              onChange={(e) => updateData({ showname: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('slogan')}</label>
            <input
              type="text"
              placeholder={tr('sloganPh')}
              value={data.slogan}
              onChange={(e) => updateData({ slogan: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm mb-2">
              {tb('gender')} <span className="text-red-500">*</span>
            </label>
            <select
              value={data.gender}
              onChange={(e) => updateData({ gender: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="female">{tr('opts.gender.female')}</option>
              <option value="male">{tr('opts.gender.male')}</option>
              <option value="trans">{tr('opts.gender.trans')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">{tb('ethnicity')}</label>
            <select
              value={data.ethnicity}
              onChange={(e) => updateData({ ethnicity: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="caucasian">{tr('opts.ethnicity.caucasian')}</option>
              <option value="asian">{tr('opts.ethnicity.asian')}</option>
              <option value="latina">{tr('opts.ethnicity.latina')}</option>
              <option value="ebony">{tr('opts.ethnicity.ebony')}</option>
              <option value="arabic">{tr('opts.ethnicity.arabic')}</option>
              <option value="mixed">{tr('opts.ethnicity.mixed')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('nationality')}</label>
            <select
              value={data.nationality}
              onChange={(e) => updateData({ nationality: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="swiss">{tr('opts.nationality.swiss')}</option>
              <option value="german">{tr('opts.nationality.german')}</option>
              <option value="french">{tr('opts.nationality.french')}</option>
              <option value="italian">{tr('opts.nationality.italian')}</option>
              <option value="spanish">{tr('opts.nationality.spanish')}</option>
              <option value="romanian">{tr('opts.nationality.romanian')}</option>
              <option value="hungarian">{tr('opts.nationality.hungarian')}</option>
              <option value="brazilian">{tr('opts.nationality.brazilian')}</option>
              <option value="colombian">{tr('opts.nationality.colombian')}</option>
              <option value="russian">{tr('opts.nationality.russian')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('age')}</label>
            <input
              type="number"
              placeholder={tr('agePh')}
              value={data.age}
              onChange={(e) => updateData({ age: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 mt-8">{tb('physicalFeatures')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">{tb('hairColor')}</label>
            <select
              value={data.hairColor}
              onChange={(e) => updateData({ hairColor: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="blonde">{tr('opts.hair.blonde')}</option>
              <option value="brunette">{tr('opts.hair.brunette')}</option>
              <option value="black">{tr('opts.hair.black')}</option>
              <option value="red">{tr('opts.hair.red')}</option>
              <option value="other">{tr('opts.hair.other')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('eyeColor')}</label>
            <select
              value={data.eyeColor}
              onChange={(e) => updateData({ eyeColor: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="blue">{tr('opts.eye.blue')}</option>
              <option value="green">{tr('opts.eye.green')}</option>
              <option value="brown">{tr('opts.eye.brown')}</option>
              <option value="hazel">{tr('opts.eye.hazel')}</option>
              <option value="gray">{tr('opts.eye.gray')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">{tb('height')}</label>
            <div className="flex">
              <input
                type="number"
                placeholder={tr('heightPh')}
                value={data.height}
                onChange={(e) => updateData({ height: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">{tr('cm')}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('weight')}</label>
            <div className="flex">
              <input
                type="number"
                placeholder={tr('weightPh')}
                value={data.weight}
                onChange={(e) => updateData({ weight: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">{tr('kg')}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('dressSize')}</label>
            <select
              value={data.dressSize}
              onChange={(e) => updateData({ dressSize: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="xs">XS</option>
              <option value="s">S</option>
              <option value="m">M</option>
              <option value="l">L</option>
              <option value="xl">XL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">{tr('shoeSize')}</label>
            <input
              type="number"
              placeholder={tr('shoeSizePh')}
              value={data.shoeSize}
              onChange={(e) => updateData({ shoeSize: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">{tb('bust')}</label>
            <div className="flex">
              <input
                type="number"
                placeholder={tr('bustPh')}
                value={data.bust}
                onChange={(e) => updateData({ bust: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">{tr('cm')}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('waist')}</label>
            <div className="flex">
              <input
                type="number"
                placeholder={tr('waistPh')}
                value={data.waist}
                onChange={(e) => updateData({ waist: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">{tr('cm')}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('hip')}</label>
            <div className="flex">
              <input
                type="number"
                placeholder={tr('hipPh')}
                value={data.hip}
                onChange={(e) => updateData({ hip: e.target.value })}
                className="w-full border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <span className="bg-gray-200 border border-l-0 border-gray-300 rounded-r px-3 py-2 text-sm">{tr('cm')}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2">{tr('cupSize')}</label>
            <select
              value={data.cupSize}
              onChange={(e) => updateData({ cupSize: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="a">{tr('opts.cup.a')}</option>
              <option value="b">{tr('opts.cup.b')}</option>
              <option value="c">{tr('opts.cup.c')}</option>
              <option value="d">{tr('opts.cup.d')}</option>
              <option value="dd">{tr('opts.cup.dd')}</option>
              <option value="e">{tr('opts.cup.e')}</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-2">{tb('pubicHair')}</label>
          <select
            value={data.pubicHair}
            onChange={(e) => updateData({ pubicHair: e.target.value })}
            className="w-full md:w-1/3 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">{tc('select')}</option>
            <option value="shaved">{tr('opts.pubic.shaved')}</option>
            <option value="trimmed">{tr('opts.pubic.trimmed')}</option>
            <option value="natural">{tr('opts.pubic.natural')}</option>
          </select>
        </div>

        <h2 className="text-xl font-bold mb-4 mt-8">{tb('additionalInfo')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm mb-2">{tb('smoking')}</label>
            <select
              value={data.smoking}
              onChange={(e) => updateData({ smoking: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="yes">{tb('yes')}</option>
              <option value="no">{tb('no')}</option>
              <option value="occasionally">{tb('occasionally')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">{tb('drinking')}</label>
            <select
              value={data.drinking}
              onChange={(e) => updateData({ drinking: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">{tc('select')}</option>
              <option value="yes">{tb('yes')}</option>
              <option value="no">{tb('no')}</option>
              <option value="socially">{tr('opts.drinking.socially')}</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm mb-2">{tb('specialChars')}</label>
          <textarea
            placeholder={tr('specialPh')}
            value={data.specialCharacteristics}
            onChange={(e) => updateData({ specialCharacteristics: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        <h2 className="text-xl font-bold mb-4 mt-8">{tr('blockHeading')}</h2>
        <p className="text-sm text-gray-700 mb-4">
          {tr('blockHelp1')}
          <br />
          {tr('blockHelp2')}
          <br />
          {tr('blockHelp3')}
          <br />
          <strong>{tr('blockNoSwitzerland')}</strong>
        </p>

        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => updateData({ blockMode: 'block' })}
            className={`px-6 py-2 rounded-full border-2 transition ${
              data.blockMode === 'block'
                ? 'border-pink-500 bg-pink-50 text-pink-600'
                : 'border-gray-300 text-gray-600 hover:border-pink-300'
            }`}
          >
            {tr('block')}
          </button>
          <button
            type="button"
            onClick={() => updateData({ blockMode: 'allow' })}
            className={`px-6 py-2 rounded-full border-2 transition ${
              data.blockMode === 'allow'
                ? 'border-pink-500 bg-pink-50 text-pink-600'
                : 'border-gray-300 text-gray-600 hover:border-pink-300'
            }`}
          >
            {tr('allow')}
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <select
            className="w-full md:w-1/3 border border-gray-300 rounded px-3 py-2"
            value={pendingCountry}
            onChange={(e) => setPendingCountry(e.target.value)}
          >
            <option value="">{tr('countriesPlaceholder')}</option>
            {countries.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addCountry}
            disabled={!pendingCountry}
            className="bg-white border-2 border-pink-500 text-pink-600 px-6 py-2 rounded hover:bg-pink-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tRoot('add')}
          </button>
        </div>
        {data.blockCountries.length > 0 && (
          <ul className="text-sm text-gray-600 mb-6 list-disc pl-5">
            {data.blockCountries.map((c) => (
              <li key={c}>{countries.find((x) => x.value === c)?.label ?? c}</li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={nextStep}
          className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-8 py-3 rounded font-semibold hover:from-pink-700 hover:to-pink-600 transition"
        >
          {tRoot('nextStep')}
        </button>
      </div>
    </div>
  )
}
