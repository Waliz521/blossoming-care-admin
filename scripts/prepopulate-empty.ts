/**
 * Prepopulate Admin `locations` table with all map locations (Option 1).
 *
 * Inserts ONLY missing `name`s (does not overwrite existing records).
 * Default inactive values:
 * - population: 0
 * - territory: ''
 * - status: 'unavailable'
 *
 * Run: npm run prepopulate-empty
 * Requires: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) in .env
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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

// Hampshire split areas (mirrors the main seed logic, but with inactive defaults)
const HAMPSHIRE_AREAS = [
  { name: 'Portsmouth', type: 'Borough' as const, region: 'England' as const },
  { name: 'Fareham', type: 'Borough' as const, region: 'England' as const },
  { name: 'Gosport', type: 'Borough' as const, region: 'England' as const },
  { name: 'Havant', type: 'Borough' as const, region: 'England' as const },
  { name: 'East Hampshire', type: 'Borough' as const, region: 'England' as const },
  { name: 'Southampton', type: 'Borough' as const, region: 'England' as const },
  { name: 'Basingstoke and Deane', type: 'Borough' as const, region: 'England' as const },
  { name: 'Hart', type: 'Borough' as const, region: 'England' as const },
  { name: 'Test Valley', type: 'Borough' as const, region: 'England' as const },
  { name: 'Winchester', type: 'Borough' as const, region: 'England' as const },
  { name: 'New Forest', type: 'Borough' as const, region: 'England' as const },
  { name: 'Eastleigh', type: 'Borough' as const, region: 'England' as const },
  { name: 'Rushmoor', type: 'Borough' as const, region: 'England' as const },
]

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\([^)]*\)/g, '').trim()
}

async function main() {
  const jsonPath = resolve(__dirname, '../../uk-territories-map/src/data/territoriesParsed.json')
  const raw = readFileSync(jsonPath, 'utf-8')
  const parsed: Array<{ name: string; type: string; region: string; population: number; territory: string }> =
    JSON.parse(raw)

  // Exclude Hampshire 30-34 (split handled by HAMPSHIRE_AREAS)
  const fromJson = parsed.filter(
    (r) => !(r.territory === '30-34' && normalizeName(r.name) === 'hampshire')
  )

  const inactiveDefaults = {
    population: 0,
    territory: '',
    status: 'unavailable' as const,
    metadata: '',
  }

  const records = fromJson.map((r) => ({
    name: r.name,
    type: r.type as 'Borough' | 'County',
    region: r.region as 'England' | 'Wales',
    ...inactiveDefaults,
  }))

  const hampshireRecords = HAMPSHIRE_AREAS.map((r) => ({
    name: r.name,
    type: r.type,
    region: r.region,
    ...inactiveDefaults,
  }))

  const all = [...records, ...hampshireRecords]

  const { data: existing, error: existErr } = await supabase
    .from('locations')
    .select('name')

  if (existErr) {
    console.error('Failed to read existing locations:', existErr.message)
    process.exit(1)
  }

  const existingNames = new Set((existing ?? []).map((e) => e.name))
  const toInsert = all.filter((r) => !existingNames.has(r.name))

  console.log(`Existing locations: ${existingNames.size}`)
  console.log(`Prepopulating missing locations: ${toInsert.length} (total map locations: ${all.length})`)

  if (toInsert.length === 0) {
    console.log('No new locations to insert.')
    process.exit(0)
  }

  const { error: insErr } = await supabase.from('locations').insert(toInsert)
  if (insErr) {
    console.error('Prepopulate failed:', insErr.message)
    process.exit(1)
  }

  console.log('Prepopulate complete.')
}

main()

