/**
 * Seed Supabase with locations from territoriesParsed.json + Hampshire split + status overrides.
 * Run: npm run seed (from admin/)
 * Requires: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

// Hampshire split areas (from territories.ts)
const HAMPSHIRE_AREAS = [
  { name: 'Portsmouth', type: 'Borough' as const, region: 'England' as const, population: 208_000, territory: 'hampshire-south' },
  { name: 'Fareham', type: 'Borough' as const, region: 'England' as const, population: 115_428, territory: 'hampshire-south' },
  { name: 'Gosport', type: 'Borough' as const, region: 'England' as const, population: 82_921, territory: 'hampshire-south' },
  { name: 'Havant', type: 'Borough' as const, region: 'England' as const, population: 126_985, territory: 'hampshire-east' },
  { name: 'East Hampshire', type: 'Borough' as const, region: 'England' as const, population: 129_975, territory: 'hampshire-east' },
  { name: 'Southampton', type: 'Borough' as const, region: 'England' as const, population: 252_000, territory: 'hampshire-east' },
  { name: 'Basingstoke and Deane', type: 'Borough' as const, region: 'England' as const, population: 193_110, territory: 'hampshire-north' },
  { name: 'Hart', type: 'Borough' as const, region: 'England' as const, population: 103_162, territory: 'hampshire-north' },
  { name: 'Test Valley', type: 'Borough' as const, region: 'England' as const, population: 135_201, territory: 'hampshire-north' },
  { name: 'Winchester', type: 'Borough' as const, region: 'England' as const, population: 135_632, territory: 'hampshire-new-forest' },
  { name: 'New Forest', type: 'Borough' as const, region: 'England' as const, population: 176_116, territory: 'hampshire-new-forest' },
  { name: 'Eastleigh', type: 'Borough' as const, region: 'England' as const, population: 142_933, territory: 'hampshire-new-forest' },
  { name: 'Rushmoor', type: 'Borough' as const, region: 'England' as const, population: 95_000, territory: 'hampshire-unassigned' },
]

// Status overrides (from territories.ts CLIENT_STATUS_OVERRIDES)
const STATUS_OVERRIDES: Record<string, string> = {
  '27': 'reserved',
  '4': 'available', '6': 'available', '7': 'available', '10': 'available',
  '17': 'available', '18': 'available', '22': 'available', '25': 'available', '26': 'available',
  '30-34': 'available',
  'hampshire-south': 'available', 'hampshire-east': 'available', 'hampshire-north': 'available',
  'hampshire-new-forest': 'available', 'hampshire-unassigned': 'unavailable',
  '35': 'available', '36-37': 'available', '38-40': 'available', '43': 'available',
  '45-46': 'available', '49-50': 'available', '53-55': 'available', '67-70': 'available',
  '87-89': 'available', '90-92': 'available', '93-95': 'available', '99-101': 'available',
  '101-103': 'available', '104-106': 'available', '107-109': 'available', '110-112': 'available',
  '113-116': 'available', '117-120': 'available', '121-124': 'available', '125-128': 'available',
  '129-132': 'available', '138-142': 'available', '159-164': 'available',
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\([^)]*\)/g, '').trim()
}

async function main() {
  const jsonPath = resolve(__dirname, '../../uk-territories-map/src/data/territoriesParsed.json')
  const raw = readFileSync(jsonPath, 'utf-8')
  const parsed: Array<{ name: string; type: string; region: string; population: number; territory: string }> =
    JSON.parse(raw)

  // Exclude Hampshire from 30-34 (split into 4 territories)
  const fromJson = parsed.filter(
    (r) => !(r.territory === '30-34' && normalizeName(r.name) === 'hampshire')
  )

  const records = fromJson.map((r) => ({
    name: r.name,
    type: r.type as 'Borough' | 'County',
    region: r.region as 'England' | 'Wales',
    population: r.population,
    territory: r.territory || '',
    status: (STATUS_OVERRIDES[r.territory] ?? 'unavailable') as 'sold' | 'reserved' | 'available' | 'unavailable',
    metadata: '',
  }))

  const hampshireRecords = HAMPSHIRE_AREAS.map((r) => ({
    name: r.name,
    type: r.type,
    region: r.region,
    population: r.population,
    territory: r.territory,
    status: (STATUS_OVERRIDES[r.territory] ?? 'unavailable') as 'sold' | 'reserved' | 'available' | 'unavailable',
    metadata: '',
  }))

  const all = [...records, ...hampshireRecords]
  console.log(`Seeding ${all.length} locations...`)

  // Clear existing (use service role key to bypass RLS)
  const { error: delErr } = await supabase.from('locations').delete().gte('population', 0)
  if (delErr) {
    console.warn('Could not clear existing (RLS?):', delErr.message)
    console.log('Attempting insert anyway...')
  }

  const { error } = await supabase.from('locations').insert(all)
  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }
  console.log('Seed complete.')
}

main()
