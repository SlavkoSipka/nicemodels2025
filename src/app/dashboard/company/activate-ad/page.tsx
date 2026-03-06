'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShoppingCart, Zap, Clock, Calendar, CheckCircle, Building2 } from 'lucide-react'

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
  const [hasActiveAd, setHasActiveAd] = useState(false)
  const [activeAdExpiry, setActiveAdExpiry] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string>('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    const pkgData = await loadPackages()
    loadCart(pkgData)
    checkActiveAd()
  }

  const checkActiveAd = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('order_items')
        .select(`
          id,
          activation_date,
          orders!inner(user_id, status, created_at),
          products!inner(product_type, duration_days, duration_hours)
        `)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'paid')
        .eq('products.product_type', 'ad_package')

      if (!data || data.length === 0) return

      const now = new Date()
      for (const item of data) {
        const order = (item as any).orders
        const product = (item as any).products
        const startDate = item.activation_date
          ? new Date(item.activation_date)
          : new Date(order.created_at)
        const durationMs = (product.duration_days * 86400000) + (product.duration_hours * 3600000)
        const expiryDate = new Date(startDate.getTime() + durationMs)

        if (startDate <= now && expiryDate > now) {
          setHasActiveAd(true)
          setActiveAdExpiry(expiryDate.toLocaleDateString('en-CH', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
          }))
          return
        }
      }
    } catch (e) {
      console.error('Error checking active ad:', e)
    }
  }

  const loadPackages = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_type', 'ad_package')
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('Error loading packages:', error)
    }
    const pkgList = data || []
    setPackages(pkgList)
    setLoading(false)
    return pkgList
  }

  const loadCart = (validPackages: Product[]) => {
    const savedCart = localStorage.getItem('company_unified_cart')
    if (!savedCart) return
    const allCart = JSON.parse(savedCart)
    const validIds = new Set(validPackages.map(p => p.id))
    const filtered = allCart.filter(
      (item: CartItem) =>
        item.product?.product_type === 'ad_package' && validIds.has(item.product?.id)
    )
    if (filtered.length !== allCart.filter((i: CartItem) => i.product?.product_type === 'ad_package').length) {
      localStorage.setItem('company_unified_cart', JSON.stringify(filtered))
    }
    setCart(filtered)
  }

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem('company_unified_cart', JSON.stringify(newCart))
    setCart(newCart)
  }

  const addToCart = () => {
    if (!selectedPackage) return
    if (activationType === 'at_date' && !activationDate) return

    const newItem: CartItem = {
      product: selectedPackage,
      activationType,
      activationDate: activationType === 'at_date' ? activationDate : undefined
    }

    saveCart([...cart, newItem])
    setSelectedPackage(null)
    setActivationType('immediately')
    setActivationDate('')
  }

  const removeFromCart = (index: number) => {
    saveCart(cart.filter((_, i) => i !== index))
  }

  const goToCheckout = async () => {
    if (cart.length === 0) return
    setCheckoutError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const validIds = new Set(packages.map(p => p.id))
      const validCart = cart.filter(item => validIds.has(item.product.id))
      if (validCart.length !== cart.length) {
        saveCart(validCart)
        setCheckoutError('Your cart had outdated items. Please try again.')
        return
      }

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
        setCheckoutError(orderError?.message || 'Failed to create order')
        return
      }

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
          if (itemError.code === '23503') {
            saveCart([])
            setCheckoutError('Your cart contained outdated items. Please select packages again and try checkout.')
          } else {
            setCheckoutError(itemError.message || 'Failed to create order item')
          }
          return
        }
      }

      saveCart([])
      router.push('/dashboard/company')
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50 ml-[280px]">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-6 ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Activate Club Ad</h1>
              <p className="text-xs text-gray-500">
                Beta phase — all activations are <span className="font-semibold text-emerald-600">100% free</span>
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={goToCheckout}
              className="relative flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart: {cart.length} item{cart.length > 1 ? 's' : ''}
              <span className="ml-1 px-1.5 py-0.5 bg-white text-brand rounded text-xs font-bold">Free</span>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {cart.length}
              </span>
            </button>
          )}
        </div>

        {/* Beta info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm text-emerald-900">
            <span className="font-bold">Beta Info:</span> All packages are currently <span className="font-semibold">free for early clubs</span>.
            No payment required. We will clearly inform you before any pricing starts.
          </p>
        </div>

        {checkoutError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{checkoutError}</p>
          </div>
        )}

        {/* Active ad status */}
        {hasActiveAd && (
          <div className="bg-white border border-emerald-200 rounded-lg p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 mb-1">Your club ad is currently active</p>
              <p className="text-sm text-gray-600">
                Your club profile is visible in search results.
              </p>
              {activeAdExpiry && (
                <p className="text-xs text-gray-400 mt-1">Active until: {activeAdExpiry}</p>
              )}
            </div>
          </div>
        )}

        {/* Package cards */}
        {!hasActiveAd && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-bold text-gray-800 mb-4">Select duration:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id
                const isInCart = cart.some(item => item.product.id === pkg.id)

                return (
                  <div
                    key={pkg.id}
                    onClick={() => !isInCart && setSelectedPackage(pkg)}
                    className={`relative rounded-lg border-2 transition-all ${
                      isInCart
                        ? 'border-emerald-400 bg-emerald-50/50 opacity-70 cursor-not-allowed'
                        : isSelected
                          ? 'border-brand bg-brand/5 shadow-sm cursor-pointer'
                          : 'border-gray-200 bg-white hover:border-brand/50 cursor-pointer'
                    }`}
                  >
                    <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap text-white ${isInCart ? 'bg-emerald-500' : 'bg-emerald-500'}`}>
                      {isInCart ? 'Added to cart' : 'Beta — Free'}
                    </div>
                    <div className="p-5 text-center">
                      <p className="text-base font-bold text-gray-900 mb-1">{pkg.name}</p>
                      <p className="text-xs text-gray-400">{pkg.description}</p>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-sm font-bold text-emerald-600">Free</p>
                        <p className="text-xs text-gray-400 mt-0.5">No payment needed</p>
                      </div>
                    </div>
                    {isInCart ? (
                      <div className="absolute bottom-2.5 right-2.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : isSelected ? (
                      <div className="absolute bottom-2.5 right-2.5 w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Activation type */}
        {!hasActiveAd && selectedPackage && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-bold text-gray-800 mb-3">Activation date:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'immediately', label: 'Immediately', icon: Zap },
                { value: 'after_current', label: 'After current', icon: Clock },
                { value: 'at_date', label: 'At certain date', icon: Calendar },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setActivationType(value as any)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activationType === value
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {activationType === 'at_date' && (
              <div className="mt-3">
                <input
                  type="datetime-local"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            )}
          </div>
        )}

        {/* Add to cart */}
        {!hasActiveAd && selectedPackage && (
          <button
            onClick={addToCart}
            disabled={activationType === 'at_date' && !activationDate}
            className="px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add to cart
          </button>
        )}

        {/* Cart */}
        {!hasActiveAd && cart.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-sm font-bold text-gray-800 mb-3">Your cart:</p>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.activationType === 'immediately' ? 'Activate immediately'
                        : item.activationType === 'after_current' ? 'After current ad'
                        : `On ${item.activationDate ? new Date(item.activationDate).toLocaleDateString() : ''}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-emerald-600">Free</span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm font-bold text-gray-900">Total (beta):</p>
              <p className="text-base font-bold text-emerald-600">Free</p>
            </div>

            <button
              onClick={goToCheckout}
              className="w-full mt-3 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700"
            >
              Confirm free activation (beta)
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
