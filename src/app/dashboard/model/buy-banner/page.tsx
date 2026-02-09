'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, ShoppingCart } from 'lucide-react'
import Image from 'next/image'

interface Product {
  id: string
  product_type: string
  name: string
  description: string
  price_chf: number
  duration_days: number
  banner_type: string
  is_popular: boolean
}

interface BannerCartItem {
  product: Product
  bannerFile: File
  bannerPreview: string
  advertisingText: string
  contactInfo: {
    countryCode: string
    phoneNumber: string
    email: string
    website: string
  }
}

export default function BuyBannerPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<Product[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null)
  
  // Form data
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [advertisingText, setAdvertisingText] = useState('')
  const [countryCode, setCountryCode] = useState('+41')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    loadPackages()
    loadUserData()
  }, [])

  const loadPackages = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_type', 'banner_package')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('Error loading packages:', error)
    } else {
      setPackages(data || [])
    }
    setLoading(false)
  }

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (profile) {
      setEmail(profile.email || '')
    }

    // Load contact details if exists
    const { data: contactDetails } = await supabase
      .from('model_contact_details')
      .select('country_code, phone_number')
      .eq('model_id', user.id)
      .single()

    if (contactDetails) {
      setCountryCode(contactDetails.country_code || '+41')
      setPhoneNumber(contactDetails.phone_number || '')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setBannerFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setBannerPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAddToCart = () => {
    // Validation
    if (!bannerFile) {
      alert('Please upload a banner image')
      return
    }

    if (!advertisingText.trim()) {
      alert('Please enter advertising text')
      return
    }

    if (!selectedPackage) {
      alert('Please select a banner package')
      return
    }

    if (!phoneNumber.trim() && !email.trim() && !website.trim()) {
      alert('Please provide at least one contact method')
      return
    }

    // Create cart item
    const cartItem: BannerCartItem = {
      product: selectedPackage,
      bannerFile: bannerFile,
      bannerPreview: bannerPreview || '',
      advertisingText: advertisingText,
      contactInfo: {
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        email: email,
        website: website
      }
    }

    // Get existing cart
    const savedCart = localStorage.getItem('unified_cart_banners')
    const cart = savedCart ? JSON.parse(savedCart) : []
    cart.push(cartItem)
    
    // Save banner data separately (Files can't be stringified)
    localStorage.setItem('unified_cart_banners', JSON.stringify(cart.map((item: BannerCartItem) => ({
      product: item.product,
      bannerPreview: item.bannerPreview,
      advertisingText: item.advertisingText,
      contactInfo: item.contactInfo,
      fileName: item.bannerFile.name
    }))))
    
    // Store file separately in session
    sessionStorage.setItem(`banner_file_${cart.length - 1}`, bannerPreview || '')
    
    alert('Banner added to cart!')
    router.push('/dashboard/model/checkout')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 ml-[280px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 ml-[280px] bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            Setup Your Banner
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Required fields are marked with <span className="text-red-500">*</span>
          </p>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            File Upload <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="banner-upload"
            />
            <label
              htmlFor="banner-upload"
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-pink-300 rounded-lg cursor-pointer hover:border-pink-500 transition-all bg-pink-50"
            >
              {bannerPreview ? (
                <div className="relative w-full h-full p-4">
                  <Image
                    src={bannerPreview}
                    alt="Banner preview"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-12 h-12 text-pink-500 mb-2" />
                  <span className="text-pink-600 font-semibold">UPLOAD</span>
                  <span className="text-sm text-gray-500 mt-2">Click to select banner image</span>
                </div>
              )}
            </label>
          </div>
          {bannerFile && (
            <p className="text-sm text-gray-600 mt-2">Selected: {bannerFile.name}</p>
          )}
        </div>

        {/* Advertising Text */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Advertising text / advertising slogan / banner text <span className="text-red-500">*</span>
          </label>
          
          <textarea
            value={advertisingText}
            onChange={(e) => setAdvertisingText(e.target.value)}
            placeholder="Advertising text *"
            maxLength={5000}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          />
          
          <div className="flex justify-end items-center mt-2">
            <span className="text-sm text-gray-500">{advertisingText.length} / 5000</span>
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-4">Contacts</label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="+41">Switzerland (+41)</option>
                <option value="+43">Austria (+43)</option>
                <option value="+49">Germany (+49)</option>
              </select>
            </div>
            
            <div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone Number *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail Address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Website"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Banner Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-900 mb-4">
            Banner type <span className="text-red-500">*</span>
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative bg-white rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedPackage?.id === pkg.id
                    ? 'border-pink-600 shadow-lg'
                    : 'border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {pkg.is_popular && (
                  <div className="absolute -top-3 -right-3 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold transform rotate-12">
                    POPULAR
                  </div>
                )}

                <div className="p-4">
                  <h3 className="text-base font-bold text-pink-600 mb-1">{pkg.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                  
                  {/* Preview Image */}
                  <div className="bg-gray-100 rounded-lg p-2 mb-3">
                    <div className="bg-white rounded p-2">
                      <div className="grid grid-cols-3 gap-1">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className={`aspect-square ${i === 4 ? 'bg-pink-500' : 'bg-gray-200'} rounded`}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="bg-pink-600 text-white text-center py-2 rounded-lg font-bold">
                    CHF {pkg.price_chf}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="flex justify-start">
          <button
            onClick={handleAddToCart}
            disabled={!bannerFile || !advertisingText || !selectedPackage}
            className="px-8 py-4 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
          >
            ADD TO CART
          </button>
        </div>
      </div>
    </div>
  )
}
