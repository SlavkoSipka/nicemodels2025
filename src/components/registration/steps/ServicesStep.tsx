'use client'

import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
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

export default function ServicesStep({ data, updateData, nextStep, prevStep, currentStep, totalSteps }: Props) {
  const [mainServicesOpen, setMainServicesOpen] = useState(true)
  const [extraServicesOpen, setExtraServicesOpen] = useState(false)
  const [fetishOpen, setFetishOpen] = useState(false)
  const [virtualOpen, setVirtualOpen] = useState(false)
  const [massageOpen, setMassageOpen] = useState(false)

  const mainServices = [
    '69 Position', 'Anal Sex', 'Cum in Mouth', 'Cum on Face', 'Dildo Play/Toys',
    'Girlfriend Experience (GFE)', 'Blowjob with Condom', 'Blowjob without Condom',
    'Blowjob without Condom to Completion', 'Cumshot on body (COB)', 'Erotic massage',
    'Kissing if good chemistry', 'Intimate massage', 'Handjob', 'French Kissing', 'Kissing',
    'Sex in Different Positions'
  ]

  const extraServices = [
    'A-Level (Anal Sex)', 'Anal Finger', 'BDSM', 'Body to Body Massage', 'Couples',
    'Deep Throat', 'Dirty Talk', 'Domination', 'Erotic Photos & Videos', 'Facesitting',
    'Foot Fetish', 'Golden Shower (Give)', 'Golden Shower (Receive)', 'Lapdance',
    'Lesbian Show', 'Lingam Massage', 'Mistress', 'Oral without Condom',
    'Passionate Kissing', 'Photo & Video', 'Pornstar Experience (PSE)', 'Prostate Massage',
    'Role Play', 'Sex Toys', 'Spanking', 'Squirting', 'Striptease', 'Submission',
    'Swallow', 'Tantric Massage', 'Threesome', 'Uniforms'
  ]

  const fetishServices = [
    'Age Play', 'Ball Busting', 'Bondage', 'CBT', 'Chastity', 'Cross Dressing',
    'Face Slapping', 'Feminization', 'Financial Domination', 'Foot Worship',
    'Humiliation', 'Medical Play', 'Pet Play', 'Rimming (Giving)', 'Rimming (Receiving)',
    'Strap-on', 'Trampling', 'Wax Play', 'Worship'
  ]

  const virtualServices = [
    'Cam2Cam', 'Phone Chat', 'Sexting', 'Video Call', 'Virtual Girlfriend',
    'Custom Videos', 'Dick Rating', 'Feet Pics', 'Live Shows', 'Premium Snapchat',
    'Selling Panties', 'Selling Photos', 'Selling Videos', 'Skype Shows',
    'WhatsApp Services', 'OnlyFans'
  ]

  const massageServices = [
    'Classic Massage', 'Swedish Massage', 'Thai Massage', 'Hot Stone Massage',
    'Aromatherapy', 'Sports Massage', 'Reflexology', 'Shiatsu', 'Nuru Massage',
    'Body Scrub'
  ]

  const toggleService = (service: string, category: 'main' | 'extra' | 'fetish' | 'virtual' | 'massage') => {
    const categoryKey = category === 'main' ? 'mainServices' :
                        category === 'extra' ? 'extraServices' :
                        category === 'fetish' ? 'fetishServices' :
                        category === 'virtual' ? 'virtualServices' : 'massageServices'
    
    const currentServices = data[categoryKey]
    const updated = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service]
    
    updateData({ [categoryKey]: updated })
  }

  const toggleServicesFor = (option: string) => {
    const updated = data.servicesFor.includes(option)
      ? data.servicesFor.filter(o => o !== option)
      : [...data.servicesFor, option]
    updateData({ servicesFor: updated })
  }

  return (
    <div>
      {/* Pink Header */}
      <div className="bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 cursor-pointer hover:opacity-80" onClick={prevStep} />
            <h1 className="text-2xl font-bold">Services</h1>
          </div>
          <div className="bg-white text-pink-600 rounded-full w-12 h-12 flex items-center justify-center font-bold">
            {currentStep}/{totalSteps}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Sexual Orientation */}
        <h3 className="font-semibold mb-3">Sexual Orientation</h3>
        <div className="mb-6">
          <select
            value={data.sexualOrientation}
            onChange={(e) => updateData({ sexualOrientation: e.target.value })}
            className="w-full md:w-1/3 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Sexual Orientation</option>
            <option value="heterosexual">Heterosexual</option>
            <option value="bisexual">Bisexual</option>
            <option value="lesbian">Lesbian</option>
            <option value="gay">Gay</option>
          </select>
        </div>

        {/* Services Offered For */}
        <h3 className="font-semibold mb-3">Services Offered For</h3>
        <div className="flex flex-wrap gap-3 mb-8">
          {['Men', 'Women', 'Couples', 'Trans', 'Gays', '2+'].map((option) => (
            <button
              key={option}
              onClick={() => toggleServicesFor(option)}
              className={`px-6 py-2 rounded-full border transition ${
                data.servicesFor.includes(option)
                  ? 'bg-pink-100 border-pink-500 text-pink-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-pink-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Services */}
        <h3 className="font-semibold mb-4">Services</h3>

        {/* Main Services */}
        <div className="mb-4">
          <button
            onClick={() => setMainServicesOpen(!mainServicesOpen)}
            className="w-full flex items-center justify-between bg-gray-50 p-4 rounded hover:bg-gray-100 transition"
          >
            <span className="font-semibold text-pink-600">
              Main Services {data.mainServices.length > 0 && `(${data.mainServices.length}/17)`}
            </span>
            {mainServicesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {mainServicesOpen && (
            <div className="p-4 border border-t-0 rounded-b grid grid-cols-1 md:grid-cols-2 gap-3">
              {mainServices.map((service) => (
                <label key={service} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={data.mainServices.includes(service)}
                    onChange={() => toggleService(service, 'main')}
                    className="w-5 h-5 text-pink-600"
                  />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Extra Services */}
        <div className="mb-4">
          <button
            onClick={() => setExtraServicesOpen(!extraServicesOpen)}
            className="w-full flex items-center justify-between bg-gray-50 p-4 rounded hover:bg-gray-100 transition"
          >
            <span className="font-semibold text-pink-600">
              Extra Services {data.extraServices.length > 0 && `(${data.extraServices.length}/32)`}
            </span>
            {extraServicesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {extraServicesOpen && (
            <div className="p-4 border border-t-0 rounded-b grid grid-cols-1 md:grid-cols-2 gap-3">
              {extraServices.map((service) => (
                <label key={service} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={data.extraServices.includes(service)}
                    onChange={() => toggleService(service, 'extra')}
                    className="w-5 h-5 text-pink-600"
                  />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Fetish / Bizarre */}
        <div className="mb-4">
          <button
            onClick={() => setFetishOpen(!fetishOpen)}
            className="w-full flex items-center justify-between bg-gray-50 p-4 rounded hover:bg-gray-100 transition"
          >
            <span className="font-semibold text-pink-600">
              Fetish / Bizarre {data.fetishServices.length > 0 && `(${data.fetishServices.length}/19)`}
            </span>
            {fetishOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {fetishOpen && (
            <div className="p-4 border border-t-0 rounded-b grid grid-cols-1 md:grid-cols-2 gap-3">
              {fetishServices.map((service) => (
                <label key={service} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={data.fetishServices.includes(service)}
                    onChange={() => toggleService(service, 'fetish')}
                    className="w-5 h-5 text-pink-600"
                  />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Virtual Services */}
        <div className="mb-4">
          <button
            onClick={() => setVirtualOpen(!virtualOpen)}
            className="w-full flex items-center justify-between bg-gray-50 p-4 rounded hover:bg-gray-100 transition"
          >
            <span className="font-semibold text-pink-600">
              Virtual Services {data.virtualServices.length > 0 && `(${data.virtualServices.length}/16)`}
            </span>
            {virtualOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {virtualOpen && (
            <div className="p-4 border border-t-0 rounded-b grid grid-cols-1 md:grid-cols-2 gap-3">
              {virtualServices.map((service) => (
                <label key={service} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={data.virtualServices.includes(service)}
                    onChange={() => toggleService(service, 'virtual')}
                    className="w-5 h-5 text-pink-600"
                  />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Massage services without sex! */}
        <div className="mb-6">
          <button
            onClick={() => setMassageOpen(!massageOpen)}
            className="w-full flex items-center justify-between bg-gray-50 p-4 rounded hover:bg-gray-100 transition"
          >
            <span className="font-semibold text-pink-600">
              Massage services without sex! {data.massageServices.length > 0 && `(${data.massageServices.length}/10)`}
            </span>
            {massageOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {massageOpen && (
            <div className="p-4 border border-t-0 rounded-b grid grid-cols-1 md:grid-cols-2 gap-3">
              {massageServices.map((service) => (
                <label key={service} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={data.massageServices.includes(service)}
                    onChange={() => toggleService(service, 'massage')}
                    className="w-5 h-5 text-pink-600"
                  />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          )}
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

