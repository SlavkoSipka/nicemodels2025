export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'model' | 'admin' | 'company'
          is_verified: boolean
          is_draft: boolean
          invited_email: string | null
          invite_token: string | null
          invited_by: string | null
          onboarding_completed: boolean
          phone: string | null
          date_of_birth: string | null
          first_name: string | null
          last_name: string | null
          city: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'model' | 'admin' | 'company'
          is_verified?: boolean
          is_draft?: boolean
          invited_email?: string | null
          invite_token?: string | null
          invited_by?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          last_name?: string | null
          city?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'model' | 'admin' | 'company'
          is_verified?: boolean
          is_draft?: boolean
          invited_email?: string | null
          invite_token?: string | null
          invited_by?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          last_name?: string | null
          city?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      club_details: {
        Row: {
          id: string
          club_id: string
          club_name: string
          display_name: string | null
          area: string | null
          about_description: string | null
          is_club: boolean
          entrance_fee: 'na' | 'free' | 'with_cost'
          wellness: 'na' | 'yes' | 'no'
          food_and_drinks: 'na' | 'yes' | 'no'
          outdoor_area: 'na' | 'yes' | 'no'
          city: string | null
          zip_code: string | null
          street: string | null
          street_number: string | null
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          club_name: string
          display_name?: string | null
          area?: string | null
          about_description?: string | null
          is_club?: boolean
          entrance_fee?: 'na' | 'free' | 'with_cost'
          wellness?: 'na' | 'yes' | 'no'
          food_and_drinks?: 'na' | 'yes' | 'no'
          outdoor_area?: 'na' | 'yes' | 'no'
          city?: string | null
          zip_code?: string | null
          street?: string | null
          street_number?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          club_name?: string
          display_name?: string | null
          area?: string | null
          about_description?: string | null
          is_club?: boolean
          entrance_fee?: 'na' | 'free' | 'with_cost'
          wellness?: 'na' | 'yes' | 'no'
          food_and_drinks?: 'na' | 'yes' | 'no'
          outdoor_area?: 'na' | 'yes' | 'no'
          city?: string | null
          zip_code?: string | null
          street?: string | null
          street_number?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cities: {
        Row: {
          id: string
          name: string
          postal_code: string | null
          canton: string | null
          municipality: string | null
          bfs_nr: number | null
          coordinates_e: number | null
          coordinates_n: number | null
          language: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          postal_code?: string | null
          canton?: string | null
          municipality?: string | null
          bfs_nr?: number | null
          coordinates_e?: number | null
          coordinates_n?: number | null
          language?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          postal_code?: string | null
          canton?: string | null
          municipality?: string | null
          bfs_nr?: number | null
          coordinates_e?: number | null
          coordinates_n?: number | null
          language?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      club_amenities: {
        Row: {
          id: string
          club_id: string
          amenity_name: string
          amenity_description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          amenity_name: string
          amenity_description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          amenity_name?: string
          amenity_description?: string | null
          created_at?: string
        }
      }
      club_photos: {
        Row: {
          id: string
          club_id: string
          file_path: string
          file_name: string
          is_verified: boolean
          uploaded_at: string
          display_order: number
        }
        Insert: {
          id?: string
          club_id: string
          file_path: string
          file_name: string
          is_verified?: boolean
          uploaded_at?: string
          display_order?: number
        }
        Update: {
          id?: string
          club_id?: string
          file_path?: string
          file_name?: string
          is_verified?: boolean
          uploaded_at?: string
          display_order?: number
        }
      }
      club_working_hours: {
        Row: {
          id: string
          club_id: string
          day_of_week: string
          opens_at: string | null
          closes_at: string | null
          is_closed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          day_of_week: string
          opens_at?: string | null
          closes_at?: string | null
          is_closed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          day_of_week?: string
          opens_at?: string | null
          closes_at?: string | null
          is_closed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      club_contact_details: {
        Row: {
          id: string
          club_id: string
          show_phone_number: boolean
          country_code: string
          phone_number: string | null
          has_viber: boolean
          has_whatsapp: boolean
          has_telegram: boolean
          email: string | null
          website: string | null
          contact_instruction: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          show_phone_number?: boolean
          country_code?: string
          phone_number?: string | null
          has_viber?: boolean
          has_whatsapp?: boolean
          has_telegram?: boolean
          email?: string | null
          website?: string | null
          contact_instruction?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          show_phone_number?: boolean
          country_code?: string
          phone_number?: string | null
          has_viber?: boolean
          has_whatsapp?: boolean
          has_telegram?: boolean
          email?: string | null
          website?: string | null
          contact_instruction?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      model_details: {
        Row: {
          id: string
          club_id: string | null
          location_city: string | null
          location_country: string | null
          bio: string | null
          height: number | null
          age: number | null
          phone_number: string | null
          services: string[] | null
          price_per_hour: number | null
          share_live_location: boolean
          live_location_city: string | null
          live_location_postal_code: string | null
          live_location_updated_at: string | null
          zip_code: string | null
          street: string | null
          street_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          club_id?: string | null
          location_city?: string | null
          location_country?: string | null
          bio?: string | null
          height?: number | null
          age?: number | null
          phone_number?: string | null
          services?: string[] | null
          price_per_hour?: number | null
          share_live_location?: boolean
          live_location_city?: string | null
          live_location_postal_code?: string | null
          live_location_updated_at?: string | null
          zip_code?: string | null
          street?: string | null
          street_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string | null
          location_city?: string | null
          location_country?: string | null
          bio?: string | null
          height?: number | null
          age?: number | null
          phone_number?: string | null
          services?: string[] | null
          price_per_hour?: number | null
          share_live_location?: boolean
          live_location_city?: string | null
          live_location_postal_code?: string | null
          live_location_updated_at?: string | null
          zip_code?: string | null
          street?: string | null
          street_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      job_listings: {
        Row: {
          id: string
          club_id: string
          listing_type: 'job' | 'rent'
          title: string | null
          location: string
          description: string
          country_code: string | null
          phone_number: string | null
          has_whatsapp: boolean
          has_viber: boolean
          has_telegram: boolean
          has_sms: boolean
          email: string | null
          website: string | null
          status: 'active' | 'expired' | 'deleted'
          starts_at: string
          expires_at: string | null
          rent_price_daily: number | null
          rent_price_weekly: number | null
          rent_price_monthly: number | null
          rent_work_permit: boolean
          rent_room_size: string | null
          rent_furnished: boolean
          rent_kitchen: boolean
          rent_bathroom: boolean
          rent_air_conditioning: boolean
          rent_towels: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          club_id: string
          listing_type?: 'job' | 'rent'
          title?: string | null
          location: string
          description: string
          country_code?: string | null
          phone_number?: string | null
          has_whatsapp?: boolean
          has_viber?: boolean
          has_telegram?: boolean
          has_sms?: boolean
          email?: string | null
          website?: string | null
          status?: 'active' | 'expired' | 'deleted'
          starts_at?: string
          expires_at?: string | null
          rent_price_daily?: number | null
          rent_price_weekly?: number | null
          rent_price_monthly?: number | null
          rent_work_permit?: boolean
          rent_room_size?: string | null
          rent_furnished?: boolean
          rent_kitchen?: boolean
          rent_bathroom?: boolean
          rent_air_conditioning?: boolean
          rent_towels?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          listing_type?: 'job' | 'rent'
          title?: string | null
          location?: string
          description?: string
          country_code?: string | null
          phone_number?: string | null
          has_whatsapp?: boolean
          has_viber?: boolean
          has_telegram?: boolean
          has_sms?: boolean
          email?: string | null
          website?: string | null
          status?: 'active' | 'expired' | 'deleted'
          starts_at?: string
          expires_at?: string | null
          rent_price_daily?: number | null
          rent_price_weekly?: number | null
          rent_price_monthly?: number | null
          rent_work_permit?: boolean
          rent_room_size?: string | null
          rent_furnished?: boolean
          rent_kitchen?: boolean
          rent_bathroom?: boolean
          rent_air_conditioning?: boolean
          rent_towels?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      verifications: {
        Row: {
          id: string
          user_id: string
          first_name: string
          surname: string
          date_of_birth: string
          id_number: string
          id_card_photo_path: string
          selfie_photo_path: string
          video_path: string | null
          status: 'pending' | 'approved' | 'rejected'
          submitted_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          surname: string
          date_of_birth: string
          id_number: string
          id_card_photo_path: string
          selfie_photo_path: string
          video_path?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          surname?: string
          date_of_birth?: string
          id_number?: string
          id_card_photo_path?: string
          selfie_photo_path?: string
          video_path?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          submitted_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          related_entity_type: string | null
          related_entity_id: string | null
          action_url: string | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          related_entity_type?: string | null
          related_entity_id?: string | null
          action_url?: string | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          related_entity_type?: string | null
          related_entity_id?: string | null
          action_url?: string | null
          created_at?: string
          read_at?: string | null
        }
      }
      photos: {
        Row: {
          id: string
          model_id: string
          photo_url: string
          is_verified: boolean
          is_primary: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          model_id: string
          photo_url: string
          is_verified?: boolean
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          model_id?: string
          photo_url?: string
          is_verified?: boolean
          is_primary?: boolean
          display_order?: number
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon_url?: string | null
          created_at?: string
        }
      }
      listing_views: {
        Row: {
          id: string
          listing_id: string
          viewer_id: string | null
          viewer_role: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          viewer_id?: string | null
          viewer_role?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['listing_views']['Insert']>
      }
      listing_clicks: {
        Row: {
          id: string
          listing_id: string
          viewer_id: string | null
          click_type: 'phone' | 'sms' | 'email' | 'website' | 'whatsapp' | 'viber' | 'telegram'
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          viewer_id?: string | null
          click_type: 'phone' | 'sms' | 'email' | 'website' | 'whatsapp' | 'viber' | 'telegram'
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['listing_clicks']['Insert']>
      }
      banner_impressions: {
        Row: {
          id: string
          banner_id: string
          viewer_id: string | null
          page_path: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          banner_id: string
          viewer_id?: string | null
          page_path?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['banner_impressions']['Insert']>
      }
      banner_clicks: {
        Row: {
          id: string
          banner_id: string
          viewer_id: string | null
          click_type: string | null
          page_path: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          banner_id: string
          viewer_id?: string | null
          click_type?: string | null
          page_path?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['banner_clicks']['Insert']>
      }
      page_views: {
        Row: {
          id: string
          path: string
          viewer_id: string | null
          viewer_role: string | null
          session_id: string | null
          referrer: string | null
          user_agent: string | null
          ip_address: string | null
          country: string | null
          created_at: string
        }
        Insert: {
          id?: string
          path: string
          viewer_id?: string | null
          viewer_role?: string | null
          session_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          ip_address?: string | null
          country?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['page_views']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

