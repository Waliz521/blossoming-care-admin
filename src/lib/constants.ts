import type { TerritoryStatus } from '../types'

export const STATUS_LABELS: Record<TerritoryStatus, string> = {
  sold: 'Sold',
  reserved: 'Reserved',
  available: 'Available',
  unavailable: 'Not available',
}

/** Match map legend colors */
export const STATUS_COLORS: Record<TerritoryStatus, string> = {
  available: '#4caf50',
  reserved: '#1976d2',
  sold: '#6a1b9a',
  unavailable: '#9e9e9e',
}

export const STATUS_OPTIONS: TerritoryStatus[] = [
  'available',
  'reserved',
  'sold',
  'unavailable',
]
