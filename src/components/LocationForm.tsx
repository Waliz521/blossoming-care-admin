import * as Dialog from '@radix-ui/react-dialog'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Location, LocationInsert } from '../types'
import { STATUS_OPTIONS, STATUS_LABELS } from '../lib/constants'
import { Select } from './Select'

interface LocationFormProps {
  open: boolean
  onClose: () => void
  location: Location | null
  existingTerritories: string[]
}

export function LocationForm({
  open,
  onClose,
  location,
  existingTerritories,
}: LocationFormProps) {
  const [name, setName] = useState('')
  const [population, setPopulation] = useState('')
  const [territory, setTerritory] = useState('')
  const [status, setStatus] = useState<Location['status']>('unavailable')
  const [metadata, setMetadata] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (location) {
      setName(location.name)
      setPopulation(String(location.population))
      setTerritory(location.territory)
      setStatus(location.status)
      setMetadata(location.metadata ?? '')
    } else {
      setName('')
      setPopulation('')
      setTerritory('')
      setStatus('unavailable')
      setMetadata('')
    }
  }, [location, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const pop = parseInt(population, 10)
    if (Number.isNaN(pop) || pop < 0) {
      setError('Population must be a valid number')
      setSaving(false)
      return
    }
    const payload: LocationInsert = {
      name: name.trim(),
      type: location?.type ?? 'Borough',
      region: location?.region ?? 'England',
      population: pop,
      territory: territory.trim(),
      status,
      metadata: metadata.trim() || undefined,
    }
    if (location) {
      const { error } = await supabase
        .from('locations')
        .update(payload)
        .eq('id', location.id)
      if (error) {
        setError(error.message)
      } else {
        onClose()
      }
    } else {
      const { error } = await supabase.from('locations').insert(payload)
      if (error) {
        setError(error.message)
      } else {
        onClose()
      }
    }
    setSaving(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[2001] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-slate-800">
              Location form
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                ✕
              </button>
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Location name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Camden"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Population
              </label>
              <input
                type="text"
                value={population}
                onChange={(e) => setPopulation(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. 218000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Territory
              </label>
              <input
                type="text"
                list="territory-list"
                value={territory}
                onChange={(e) => setTerritory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Select existing or enter new"
              />
              <datalist id="territory-list">
                {existingTerritories.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Location['status'])}
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
                placeholder="Select status"
                ariaLabel="Status"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">
                Metadata (key:value;key:value)
              </label>
              <input
                type="text"
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Population age 60+:57,492;Median age:39.28;Unemployment rate:3.51%"
              />
            </div>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
