'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/layout/Navbar'
import ModelCard from './ModelCard'
import BannerAd from './BannerAd'
import CitySelector from './CitySelector'
import StoryStrip from './StoryStrip'

interface Model {
  id: string
  username: string
  created_at?: string
  model_details: {
    showname: string
    city: string
    age: number
    ethnicity: string
    hair_color: string
    about_me?: string
    services_for?: string[]
  }
  model_photos: Array<{
    file_path: string
  }>
}

interface Banner {
  id: string
  banner_file_path: string
  advertising_text: string
  contact_info: any
}

export default function HomePageClient() {
  const [loading, setLoading] = useState(true)
  const [models, setModels] = useState<Model[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [filteredModels, setFilteredModels] = useState<Model[]>([])
  
  // Filters
  const [selectedCity, setSelectedCity] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [selectedCity, models])

  const loadData = async () => {
    try {
      const supabase = createClient()

      // 1) Direktno pozovi funkciju iz baze koja vraća modele sa aktivnim ads-om
      //    (funkcija je SECURITY DEFINER i zaobilazi RLS komplikacije)
      const { data: modelsData, error: modelsError } = await supabase
        .rpc('models_with_active_ads')

      if (modelsError) {
        console.error('Models error (RPC models_with_active_ads):', modelsError)
        setModels([])
        setFilteredModels([])
      } else if (modelsData && modelsData.length > 0) {
        await processModels(supabase, modelsData)
      } else {
        setModels([])
        setFilteredModels([])
      }

      // 2) Učitaj aktivne bannere (nezavisno od modela)
      await loadBanners(supabase)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processModels = async (supabase: any, modelsData: any[]) => {
    try {

      // Get model details and photos for each
      const modelsWithDetails = await Promise.all(
        modelsData.map(async (model: any) => {
          // Get model details
          const { data: details, error: detailsError } = await supabase
            .from('model_details')
            .select('showname, city, age, ethnicity, hair_color, about_me, services_for')
            .eq('model_id', model.id)
            .single()

          if (detailsError) {
            console.error(`Error fetching details for model ${model.id}:`, detailsError)
          }

          // Get first photo
          const { data: photos } = await supabase
            .from('model_photos')
            .select('file_path')
            .eq('model_id', model.id)
            .eq('is_approved', true)
            .limit(1)

          let photoUrl = null
          if (photos && photos.length > 0) {
            const { data: urlData } = supabase.storage
              .from('model-photos')
              .getPublicUrl(photos[0].file_path)
            photoUrl = urlData.publicUrl
          }

          return {
            ...model,
            model_details: details,
            photoUrl,
            created_at: model.created_at || new Date().toISOString()
          }
        })
      )

      setModels(modelsWithDetails)
      setFilteredModels(modelsWithDetails)
    } catch (error) {
      console.error('Error processing models:', error)
    }
  }

  const loadBanners = async (supabase: any) => {
    try {
      // Load active banners - simplified query
      // Note: This might fail for anonymous users if RLS is enabled
      // We'll silently fail and continue without banners
      const { data: bannerOrders, error: bannersError } = await supabase
        .from('order_items')
        .select('id, banner_file_path, advertising_text, contact_phone, contact_email, contact_website, order_id')
        .not('banner_file_path', 'is', null)
        .limit(20)

      if (bannersError) {
        // Silently fail for banners - not critical
        return
      }

      if (!bannerOrders || bannerOrders.length === 0) {
        return
      }

      // Try to get paid orders - might fail for anon users
      const { data: paidOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'paid')
        .in('id', bannerOrders.map(b => b.order_id))

      const paidOrderIds = paidOrders?.map(o => o.id) || []
      const paidBanners = bannerOrders.filter(b => paidOrderIds.includes(b.order_id))

      // Get banner URLs
      const bannersWithUrls = await Promise.all(
        paidBanners.slice(0, 6).map(async (banner: any) => {
          const { data: urlData } = supabase.storage
            .from('banner-images')
            .getPublicUrl(banner.banner_file_path)
          
          return {
            ...banner,
            bannerUrl: urlData.publicUrl,
            contact_info: {
              phoneNumber: banner.contact_phone,
              email: banner.contact_email,
              website: banner.contact_website
            }
          }
        })
      )

      setBanners(bannersWithUrls)
    } catch (error) {
      // Silently fail for banners - not critical
    }
  }

  const applyFilters = () => {
    let filtered = [...models]

    if (selectedCity !== 'all') {
      filtered = filtered.filter(m => m.model_details?.city === selectedCity)
    }

    setFilteredModels(filtered)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen">
      {/* Story - horizontal circular profiles */}
      <StoryStrip models={models} />

      {/* Gradovi (City Selector) */}
      <CitySelector
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        totalModels={models.length}
        models={models}
      />

      {/* Main Content - grid puni celu širinu */}
      <div className="max-w-7xl mx-auto px-4 py-6 w-full">
        <main className="w-full">
          {filteredModels.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
              <p className="text-2xl font-bold text-gray-400 mb-2">No models found</p>
              <p className="text-gray-500">Try selecting a different city</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
              {filteredModels.map((model, index) => (
                <ModelCard key={model.id} model={model} priority={index < 3} />
              ))}
            </div>
          )}
        </main>
      </div>
      </div>
    </>
  )
}
