export interface Club {
  id: string
  username: string
  club_name: string
  display_name: string
  area: string
  city: string
  is_club: boolean
  description: string
  address: string
  phone: string
  website: string
  photoUrl: string | null
  extraPhotos: string[]
  view_count?: number
}

export type RpcClubRow = {
  id: string
  username: string
  club_name?: string | null
  display_name?: string | null
  area?: string | null
  is_club?: boolean | null
}
