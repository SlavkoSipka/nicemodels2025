'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Smartphone, Phone, CheckCircle, ShoppingBag } from 'lucide-react'

interface CartItem {
  product: {
    id: string
    product_type: string
    name: string
    description: string
    price_chf: number
    duration_days?: number
  }
  activationType?: string
  activationDate?: string
}

interface BannerCartItem {
  product: {
    id: string
    product_type: string
    name: string
    description: string
    price_chf: number
  }
  bannerPreview: string
  advertisingText: string
  contactInfo: {
    countryCode: string
    phoneNumber: string
    email: string
    website: string
  }
  fileName: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [adCart, setAdCart] = useState<CartItem[]>([])
  const [bannerCart, setBannerCart] = useState<BannerCartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'twint' | 'phone'>('card')

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = () => {
    // Load ad packages
    const savedAdCart = localStorage.getItem('unified_cart')
    if (savedAdCart) {
      const allCart = JSON.parse(savedAdCart)
      setAdCart(allCart.filter((item: CartItem) => item.product.product_type === 'ad_package'))
    }

    // Load banner packages
    const savedBannerCart = localStorage.getItem('unified_cart_banners')
    if (savedBannerCart) {
      setBannerCart(JSON.parse(savedBannerCart))
    }
  }

  const getTotalAmount = () => {
    const adTotal = adCart.reduce((sum, item) => sum + item.product.price_chf, 0)
    const bannerTotal = bannerCart.reduce((sum, item) => sum + item.product.price_chf, 0)
    return adTotal + bannerTotal
  }

  const getTotalItems = () => {
    return adCart.length + bannerCart.length
  }

  const handleConfirmOrder = async () => {
    if (getTotalItems() === 0) {
      alert('Your cart is empty!')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Please login to continue')
        router.push('/login')
        return
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: getTotalAmount(),
          status: 'pending',
          payment_method: paymentMethod
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw orderError
      }

      // Create order items for ad packages
      for (const item of adCart) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: item.product.id,
            price_chf: item.product.price_chf,
            activation_type: item.activationType || 'immediately',
            activation_date: item.activationDate ? new Date(item.activationDate).toISOString() : null
          })

        if (itemError) {
          console.error('Order item error:', itemError)
          throw itemError
        }
      }

      // Create order items for banner packages
      for (let i = 0; i < bannerCart.length; i++) {
        const item = bannerCart[i]
        
        // Upload banner file to storage
        const bannerPreview = sessionStorage.getItem(`banner_file_${i}`)
        if (!bannerPreview) continue

        // Convert base64 to blob
        const response = await fetch(bannerPreview)
        const blob = await response.blob()
        
        const fileExt = item.fileName.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('banner-images')
          .upload(fileName, blob)

        if (uploadError) {
          console.error('Banner upload error:', uploadError)
          // Continue anyway, we'll handle missing files later
        }

        // Create order item
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: item.product.id,
            price_chf: item.product.price_chf,
            banner_file_path: fileName,
            advertising_text: item.advertisingText,
            contact_phone: item.contactInfo.phoneNumber,
            contact_email: item.contactInfo.email,
            contact_website: item.contactInfo.website
          })

        if (itemError) {
          console.error('Banner order item error:', itemError)
          throw itemError
        }

        // Clean up session storage
        sessionStorage.removeItem(`banner_file_${i}`)
      }

      // Clear cart
      localStorage.removeItem('unified_cart')
      localStorage.removeItem('unified_cart_banners')
      
      alert('Order created successfully!')
      router.push('/dashboard/model')
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (getTotalItems() === 0) {
    return (
      <div className="flex-1 p-4 md:p-8 ml-0 md:ml-[280px] bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
          <div className="flex gap-4 justify-center">
            <Link href="/dashboard/model/activate-ad">
              <button className="px-6 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-all">
                Browse Ad Packages
              </button>
            </Link>
            <Link href="/dashboard/model/buy-banner">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all">
                Browse Banner Packages
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 ml-0 md:ml-[280px] bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/model/activate-ad" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Review your order and select payment method</p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          
          {/* Ad Packages */}
          {adCart.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Ad Packages</h3>
              <div className="space-y-3">
                {adCart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-pink-50 rounded-lg border border-pink-100">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        {item.product.duration_days} day{item.product.duration_days && item.product.duration_days > 1 ? 's' : ''} • 
                        Activation: {item.activationType === 'immediately' ? 'Immediately' : 
                                    item.activationType === 'after_current' ? 'After current' : 
                                    `On ${item.activationDate ? new Date(item.activationDate).toLocaleDateString() : ''}`}
                      </p>
                    </div>
                    <p className="font-bold text-pink-600 text-lg">CHF {item.product.price_chf}.-</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Banner Packages */}
          {bannerCart.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Banner Packages</h3>
              <div className="space-y-3">
                {bannerCart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">{item.product.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Banner: {item.fileName}</p>
                    </div>
                    <p className="font-bold text-blue-600 text-lg">CHF {item.product.price_chf}.-</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-2xl font-bold">
              <span className="text-gray-900">Total:</span>
              <span className="text-pink-600">CHF {getTotalAmount().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select Payment Method</h2>
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                paymentMethod === 'card'
                  ? 'border-pink-600 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-pink-600' : 'text-gray-600'}`} />
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">Credit Card</p>
                <p className="text-sm text-gray-600">Secure SSL encryption</p>
              </div>
              {paymentMethod === 'card' && <CheckCircle className="w-6 h-6 text-pink-600" />}
            </button>

            <button
              onClick={() => setPaymentMethod('twint')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                paymentMethod === 'twint'
                  ? 'border-pink-600 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Smartphone className={`w-6 h-6 ${paymentMethod === 'twint' ? 'text-pink-600' : 'text-gray-600'}`} />
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">Twint</p>
                <p className="text-sm text-gray-600">Swiss mobile payment</p>
              </div>
              {paymentMethod === 'twint' && <CheckCircle className="w-6 h-6 text-pink-600" />}
            </button>

            <button
              onClick={() => setPaymentMethod('phone')}
              className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4 ${
                paymentMethod === 'phone'
                  ? 'border-pink-600 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Phone className={`w-6 h-6 ${paymentMethod === 'phone' ? 'text-pink-600' : 'text-gray-600'}`} />
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">By Telephone</p>
                <p className="text-sm text-gray-600">Amounts up to CHF 99</p>
              </div>
              {paymentMethod === 'phone' && <CheckCircle className="w-6 h-6 text-pink-600" />}
            </button>
          </div>
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmOrder}
          disabled={loading}
          className="w-full px-8 py-4 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
        >
          {loading ? 'Processing...' : `CONFIRM ORDER - CHF ${getTotalAmount().toFixed(2)}`}
        </button>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <p className="text-sm text-blue-900">
            <span className="font-bold">Note:</span> After confirming your order, you will be contacted for payment processing. 
            Your products will be activated after successful payment verification.
          </p>
        </div>
      </div>
    </div>
  )
}
