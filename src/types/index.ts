/** Territory status - determines map colour */
export type TerritoryStatus =
  | 'sold'
  | 'reserved'
  | 'available'
  | 'unavailable'

/** Location record in database */
export interface Location {
  id: string
  name: string
  type: 'Borough' | 'County'
  region: 'England' | 'Wales'
  population: number
  territory: string
  status: TerritoryStatus
  metadata: string
  created_at: string
  updated_at: string
}

/** Insert/update payload */
export interface LocationInsert {
  name: string
  type?: 'Borough' | 'County'
  region?: 'England' | 'Wales'
  population: number
  territory: string
  status: TerritoryStatus
  metadata?: string
}
