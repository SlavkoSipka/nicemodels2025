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
          canton: string | null
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          canton?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          canton?: string | null
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
        }
        Insert: {
          id?: string
          club_id: string
          file_path: string
          file_name: string
          is_verified?: boolean
          uploaded_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          file_path?: string
          file_name?: string
          is_verified?: boolean
          uploaded_at?: string
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
          created_at?: string
          updated_at?: string
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

