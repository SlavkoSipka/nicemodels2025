'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShoppingCart, Calendar, Zap, Clock } from 'lucide-react'

interface Product {
  id: string
  product_type: string
  name: string
  description: string
  price_chf: number
  duration_days: number
  duration_hours: number
  discount_percent: number
}

interface CartItem {
  product: Product
  activationType: 'immediately' | 'after_current' | 'at_date'
  activationDate?: string
}

export default function CompanyActivateAdPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null)
  const [activationType, setActivationType] = useState<'immediately' | 'after_current' | 'at_date'>('immediately')
  const [activationDate, setActivationDate] = useState<string>('')

  useEffect(() => {
    loadPackages()
    loadCart()
  }, [])

  const loadPackages = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_type', 'ad_package')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('Error loading packages:', error)
    } else {
      setPackages(data || [])
    }
    setLoading(false)
  }

  const loadCart = () => {
    const savedCart = localStorage.getItem('company_unified_cart')
    if (savedCart) {
      const allCart = JSON.parse(savedCart)
      setCart(allCart.filter((item: CartItem) => item.product.product_type === 'ad_package'))
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem('company_unified_cart', JSON.stringify(newCart))
    setCart(newCart)
  }

  const addToCart = () => {
    if (!selectedPackage) return

    if (activationType === 'at_date' && !activationDate) {
      return
    }

    const newItem: CartItem = {
      product: selectedPackage,
      activationType,
      activationDate: activationType === 'at_date' ? activationDate : undefined
    }

    const newCart = [...cart, newItem]
    saveCart(newCart)
    
    // Reset selections
    setSelectedPackage(null)
    setActivationType('immediately')
    setActivationDate('')
  }

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index)
    saveCart(newCart)
  }

  const goToCheckout = async () => {
    if (cart.length === 0) {
      return
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Kreiraj order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'paid',
          total_amount: 0,
          payment_method: 'card'
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error('Error creating order:', orderError)
        return
      }

      // Kreiraj order_items za svaki cart item
      for (const item of cart) {
        const { error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_id: item.product.id,
            price_chf: 0,
            activation_type: item.activationType,
            activation_date: item.activationDate ? new Date(item.activationDate).toISOString() : null
          })

        if (itemError) {
          console.error('Error creating order item:', itemError)
        }
      }

      // Očisti cart
      saveCart([])
      router.push('/dashboard/company')
    } catch (error) {
      console.error('Error processing order:', error)
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activate Club Ad</h1>
            <p className="text-gray-600 mt-2">
              During the <span className="font-semibold text-pink-600">beta phase</span> all ad activations are <span className="font-semibold">100% free</span>. 
              Select what you want and we will activate it for you without any charges.
            </p>
          </div>
          
          {/* Cart Icon */}
          {cart.length > 0 && (
            <button
              onClick={goToCheckout}
              className="relative px-6 py-3 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-all shadow-md flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart: {cart.length} item(s)</span>
              <span className="ml-2 px-2 py-1 bg-white text-pink-600 rounded text-xs uppercase">
                Free beta
              </span>
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {cart.length}
              </span>
            </button>
          )}
        </div>

        {/* Info Box – Beta Free */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mb-8">
          <p className="text-sm text-green-900">
            <span className="font-bold">Beta Info:</span> All packages are currently <span className="font-semibold">free for early users</span>. 
            No online payment is required. We will clearly inform you before any pricing starts in the future.
          </p>
        </div>

        {/* Duration Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select duration:</h2>
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
                {/* Discount Badge */}
                {pkg.discount_percent > 0 && (
                  <div className="absolute -top-3 -left-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold transform -rotate-12">
                    {pkg.discount_percent}% per day
                  </div>
                )}

                <div className="p-6 text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{pkg.duration_hours} hours</p>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-lg font-bold text-green-600">Free during beta</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activation Date Selection */}
        {selectedPackage && (
          <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select activation date:</h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActivationType('immediately')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  activationType === 'immediately'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Zap className="w-5 h-5" />
                Immediately
              </button>
              
              <button
                onClick={() => setActivationType('after_current')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  activationType === 'after_current'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-5 h-5" />
                After current
              </button>
              
              <button
                onClick={() => setActivationType('at_date')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  activationType === 'at_date'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Calendar className="w-5 h-5" />
                At certain date
              </button>
            </div>

            {activationType === 'at_date' && (
              <div className="mt-4">
                <input
                  type="datetime-local"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {/* Add to Cart Button */}
        {selectedPackage && (
          <div className="mb-8">
            <button
              onClick={addToCart}
              disabled={activationType === 'at_date' && !activationDate}
              className="w-full md:w-auto px-8 py-4 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed text-lg"
            >
              ADD TO CART
            </button>
          </div>
        )}

        {/* Current Cart */}
        {cart.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your Cart:</h2>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      Activation: {item.activationType === 'immediately' ? 'Immediately' : 
                                  item.activationType === 'after_current' ? 'After current' : 
                                  `On ${item.activationDate ? new Date(item.activationDate).toLocaleDateString() : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-green-600 text-sm">Free during beta</p>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xl font-bold text-gray-900">Total (beta):</p>
              <p className="text-2xl font-bold text-green-600">Free</p>
            </div>

            <button
              onClick={goToCheckout}
              className="w-full mt-4 px-8 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-md text-lg"
            >
              CONFIRM FREE ACTIVATION (BETA)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
