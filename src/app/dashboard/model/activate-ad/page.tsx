'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { isModelSedcardFreePeriod } from '@/lib/modelSedcardFree'
import { ShoppingCart, Calendar, Zap, Clock, CheckCircle, AlertTriangle, User, Camera, ChevronRight, Info } from 'lucide-react'
import TermsAcceptance from '@/components/ui/TermsAcceptance'
import SitePreview from '@/components/preview/SitePreview'

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

export default function ActivateAdPage() {
  const router = useRouter()
  const t = useTranslations('dashboard.model.activateAd')
  const locale = useLocale()
  const dateLocaleTag = `${locale}-CH`
  const sedcardFree = isModelSedcardFreePeriod()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [packages, setPackages] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null)
  const [activationType, setActivationType] = useState<'immediately' | 'after_current' | 'at_date'>('immediately')
  const [activationDate, setActivationDate] = useState<string>('')
  const [hasActiveAd, setHasActiveAd] = useState(false)
  const [activeAdExpiry, setActiveAdExpiry] = useState<string | null>(null)
  const [lastExpiredAd, setLastExpiredAd] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string>('')
  const [termsAccepted, setTermsAccepted] = useState(false)

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
      const fmt = { day: 'numeric' as const, month: 'long' as const, year: 'numeric' as const, hour: '2-digit' as const, minute: '2-digit' as const }
      let latestExpiry: Date | null = null

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
          setActiveAdExpiry(expiryDate.toLocaleDateString(dateLocaleTag, fmt))
          return
        }

        if (expiryDate <= now && (!latestExpiry || expiryDate > latestExpiry)) {
          latestExpiry = expiryDate
        }
      }

      if (latestExpiry) {
        setLastExpiredAd(latestExpiry.toLocaleDateString(dateLocaleTag, fmt))
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
    // Hide unseeded rows (price_chf = 0) so we never render "CHF 0.-".
    const pkgList = (data || []).filter(p => Number(p.price_chf) > 0)
    setPackages(pkgList)
    setLoading(false)
    return pkgList
  }

  const loadCart = (validPackages: Product[]) => {
    const savedCart = localStorage.getItem('unified_cart')
    if (!savedCart) return
    const allCart = JSON.parse(savedCart)
    const adItems = allCart.filter((item: CartItem) => item.product?.product_type === 'ad_package')
    const validIds = new Set(validPackages.map(p => p.id))
    const filtered = adItems.filter(
      (item: CartItem) => validIds.has(item.product?.id)
    )
    if (filtered.length !== adItems.length) {
      const bannerItems = allCart.filter((item: CartItem) => item.product?.product_type === 'banner_package')
      localStorage.setItem('unified_cart', JSON.stringify([...filtered, ...bannerItems]))
    }
    setCart(filtered)
  }

  const saveCart = (newCart: CartItem[]) => {
    const savedCart = localStorage.getItem('unified_cart')
    const allCart = savedCart ? JSON.parse(savedCart) : []
    const bannerItems = allCart.filter((item: CartItem) => item.product.product_type === 'banner_package')
    const mergedCart = [...newCart, ...bannerItems]
    localStorage.setItem('unified_cart', JSON.stringify(mergedCart))
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
    if (!termsAccepted) {
      setCheckoutError(t('errAcceptTerms'))
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const validIds = new Set(packages.map(p => p.id))
      const validCart = cart.filter(item => validIds.has(item.product.id))
      if (validCart.length !== cart.length) {
        saveCart(validCart)
        setCheckoutError(t('errOutdatedCart'))
        return
      }

      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnPath: '/dashboard/model/activate-ad',
          items: cart.map(item => ({
            kind: 'ad_package',
            productId: item.product.id,
            activationType: item.activationType,
            activationDate: item.activationDate
              ? new Date(item.activationDate).toISOString()
              : null,
          })),
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setCheckoutError(j?.error || t('errCheckoutFailed'))
        return
      }
      const { url } = await res.json() as { url: string }
      saveCart([])
      window.location.href = url
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : t('errOccurred'))
    }
  }

  if (loading) return null

  const adPkgCopy = (p: Product) => {
    const d = p.duration_days
    if (d === 5) return { title: t('pkg5Title'), desc: t('pkg5Desc') }
    if (d === 14) return { title: t('pkg14Title'), desc: t('pkg14Desc') }
    if (d === 30) return { title: t('pkg30Title'), desc: t('pkg30Desc') }
    return { title: p.name, desc: p.description }
  }

  const formatUserDate = (d: Date) =>
    d.toLocaleDateString(dateLocaleTag, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 px-4 md:px-6 ml-0 md:ml-[280px]">
      <div className="max-w-6xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-brand/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-xs text-gray-500">{sedcardFree ? t('subtitleFree') : t('subtitle')}</p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={goToCheckout}
              className="relative flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover"
            >
              <ShoppingCart className="w-4 h-4" />
              {t('cartItems', { count: cart.length })}
              <span className="ml-1 px-1.5 py-0.5 bg-white text-brand rounded text-xs font-bold">
                {sedcardFree ? t('priceFree') : `CHF ${cart.reduce((s, it) => s + Number(it.product.price_chf || 0), 0)}`}
              </span>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {cart.length}
              </span>
            </button>
          )}
        </div>

        {/* Profile readiness notice */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 md:p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900 mb-1">{t('checkProfileTitle')}</p>
              <p className="text-sm text-amber-800 mb-4">{t('checkProfileBody')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {[
                  t('checkItem1'),
                  t('checkItem2'),
                  t('checkItem3'),
                  t('checkItem4'),
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-800">
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => router.push('/dashboard/model/profile/biography')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <User className="w-3.5 h-3.5" />
                  {t('editProfile')}
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => router.push('/dashboard/model/profile/pictures-video')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 text-amber-800 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {t('managePhotos')}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <SitePreview
          page="home"
          highlight="ad-card"
          title={t('previewTitle')}
          compact
        />

        {checkoutError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{checkoutError}</p>
          </div>
        )}

        {/* Active ad status */}
        {hasActiveAd && (
          <div className="bg-white border border-emerald-200 rounded-lg p-3.5 md:p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-800 mb-1">{t('currentlyActive')}</p>
              <p className="text-sm text-gray-600">{t('currentlyActiveDesc')}</p>
              {activeAdExpiry && (
                <p className="text-xs text-gray-400 mt-1">{t('activeUntil', { date: activeAdExpiry })}</p>
              )}
            </div>
          </div>
        )}

        {/* Expired ad notice */}
        {!hasActiveAd && lastExpiredAd && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 md:p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">{t('previousExpired')}</p>
              <p className="text-sm text-gray-600">
                {t.rich('expiredOn', { date: lastExpiredAd, bold: (chunks) => <span className="font-semibold">{chunks}</span> })}
              </p>
              <p className="text-xs text-gray-400 mt-1">{t('activateBelow')}</p>
            </div>
          </div>
        )}

        {/* Package cards */}
        {!hasActiveAd && (
          <div data-tour="ad-packages" className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
            <p className="text-sm font-bold text-gray-800 mb-4">{t('selectDuration')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id
                const isInCart = cart.some(item => item.product.id === pkg.id)
                const { title: pkgTitle, desc: pkgDesc } = adPkgCopy(pkg)

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
                    {isInCart && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap text-white bg-emerald-500">
                        {t('addedToCart')}
                      </div>
                    )}
                    <div className="p-3.5 md:p-5 text-center">
                      <p className="text-base font-bold text-gray-900 mb-1">{pkgTitle}</p>
                      <p className="text-xs text-gray-400">{pkgDesc}</p>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        {sedcardFree ? (
                          <>
                            <p className="text-base font-bold text-emerald-700 leading-tight">{t('priceFree')}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{t('noPaymentRequired')}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-base font-bold text-gray-900 leading-tight">
                              CHF {Number(pkg.price_chf).toFixed(0)}.-
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{t('oneTimePayment')}</p>
                          </>
                        )}
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
          <div data-tour="ad-activation" className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
            <p className="text-sm font-bold text-gray-800 mb-3">{t('activationDate')}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'immediately', label: t('actImmediately'), icon: Zap },
                { value: 'after_current', label: t('actAfterCurrent'), icon: Clock },
                { value: 'at_date', label: t('actAtDate'), icon: Calendar },
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
            data-tour="ad-add-to-cart"
            onClick={addToCart}
            disabled={activationType === 'at_date' && !activationDate}
            className="px-6 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('addToCart')}
          </button>
        )}

        {/* Cart */}
        {!hasActiveAd && cart.length > 0 && (
          <div data-tour="ad-cart" className="bg-white border border-gray-200 rounded-lg p-3.5 md:p-5">
            <p className="text-sm font-bold text-gray-800 mb-3">{t('yourCart')}</p>
            <div className="space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{adPkgCopy(item.product).title}</p>
                    <p className="text-xs text-gray-500">
                      {item.activationType === 'immediately' ? t('actImmediatelyDesc')
                        : item.activationType === 'after_current' ? t('actAfterCurrentDesc')
                        : t('actAtDateDesc', { date: item.activationDate ? formatUserDate(new Date(item.activationDate)) : '' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900">
                      {sedcardFree ? t('priceFree') : `CHF ${Number(item.product.price_chf).toFixed(0)}.-`}
                    </span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                    >
                      {t('remove')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-sm font-bold text-gray-900">{t('total')}</p>
              <p className="text-base font-bold text-gray-900">
                {sedcardFree ? t('priceFree') : `CHF ${cart.reduce((acc, it) => acc + Number(it.product.price_chf || 0), 0).toFixed(2)}`}
              </p>
            </div>

            <div data-tour="ad-terms" className="mt-3">
              <TermsAcceptance
                checked={termsAccepted}
                onChange={setTermsAccepted}
              />
            </div>
            <button
              data-tour="ad-pay"
              onClick={goToCheckout}
              disabled={!termsAccepted}
              className="w-full mt-3 py-2.5 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sedcardFree ? t('confirmActivation') : t('paySecurely')}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
