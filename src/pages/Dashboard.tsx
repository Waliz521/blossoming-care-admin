import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { Location } from '../types'
import { LocationForm } from '../components/LocationForm'
import { DeleteConfirm } from '../components/DeleteConfirm'
import { Select } from '../components/Select'
import { STATUS_LABELS, STATUS_COLORS } from '../lib/constants'

type SortKey = 'name' | 'population' | 'territory' | 'status'
type SortDir = 'asc' | 'desc'

export function Dashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)
  const [search, setSearch] = useState('')
  const [filterTerritory, setFilterTerritory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    loadLocations()
  }, [])

  async function loadLocations() {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name')
    if (error) {
      console.error(error)
      return
    }
    setLocations((data as Location[]) ?? [])
    setLoading(false)
  }

  const territoryOptions = useMemo(() => {
    const set = new Set(locations.map((l) => l.territory).filter(Boolean))
    return Array.from(set).sort((a, b) => {
      const na = parseInt(a, 10)
      const nb = parseInt(b, 10)
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
      return a.localeCompare(b)
    })
  }, [locations])

  const filteredAndSorted = useMemo(() => {
    let list = [...locations]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.territory.toLowerCase().includes(q) ||
          l.population.toString().includes(q) ||
          l.status.toLowerCase().includes(q)
      )
    }
    if (filterTerritory) {
      list = list.filter((l) => l.territory === filterTerritory)
    }
    if (filterStatus) {
      list = list.filter((l) => l.status === filterStatus)
    }
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'population':
          cmp = a.population - b.population
          break
        case 'territory':
          cmp = a.territory.localeCompare(b.territory)
          break
        case 'status':
          cmp = a.status.localeCompare(b.status)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [locations, search, filterTerritory, filterStatus, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function openAddForm() {
    setEditingLocation(null)
    setFormOpen(true)
  }

  function openEditForm(loc: Location) {
    setEditingLocation(loc)
    setFormOpen(true)
  }

  function handleFormClose() {
    setFormOpen(false)
    setEditingLocation(null)
    loadLocations()
  }

  function handleDeleteClose() {
    setDeleteTarget(null)
    loadLocations()
  }

  async function handleExportCsv() {
    const headers = ['name', 'type', 'region', 'population', 'territory', 'status', 'metadata']
    const rows = filteredAndSorted.map((l) =>
      headers.map((h) => {
        const v = (l as unknown as Record<string, unknown>)[h]
        const s = String(v ?? '')
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
      }).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `locations-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportCsv() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      if (lines.length < 2) return
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
      const nameIdx = headers.indexOf('name')
      const typeIdx = headers.indexOf('type')
      const regionIdx = headers.indexOf('region')
      const popIdx = headers.indexOf('population')
      const terrIdx = headers.indexOf('territory')
      const statusIdx = headers.indexOf('status')
      const metaIdx = headers.indexOf('metadata')
      if (nameIdx < 0 || popIdx < 0 || terrIdx < 0 || statusIdx < 0) {
        alert('CSV must have columns: name, population, territory, status')
        return
      }
      const rows: Partial<Location>[] = []
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCsvLine(lines[i])
        const name = vals[nameIdx] ?? ''
        const type = (vals[typeIdx] ?? 'Borough') as 'Borough' | 'County'
        const region = (vals[regionIdx] ?? 'England') as 'England' | 'Wales'
        const pop = parseInt(vals[popIdx] ?? '0', 10)
        const territory = vals[terrIdx] ?? ''
        const status = (vals[statusIdx] ?? 'unavailable') as Location['status']
        const metadata = metaIdx >= 0 ? (vals[metaIdx] ?? '') : ''
        if (name) rows.push({ name, type, region, population: Number.isNaN(pop) ? 0 : pop, territory, status, metadata })
      }
      const { error } = await supabase.from('locations').insert(rows)
      if (error) {
        alert('Import failed: ' + error.message)
      } else {
        loadLocations()
      }
    }
    input.click()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const ALL_VALUE = '__all__'

  const territorySelectOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: 'All territories' },
      ...territoryOptions.map((t) => ({ value: t, label: t })),
    ],
    [territoryOptions]
  )

  const statusSelectOptions = useMemo(
    () => [
      { value: ALL_VALUE, label: 'All statuses' },
      ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v })),
    ],
    []
  )

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-lg font-semibold text-slate-800">Blossoming Care Admin</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExportCsv}
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            onClick={handleImportCsv}
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Import CSV
          </button>
          <button
            onClick={openAddForm}
            className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Add location
          </button>
          <button
            onClick={handleSignOut}
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:w-auto sm:min-w-[200px]"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-medium text-slate-600">Territory</span>
            <Select
              value={filterTerritory || ALL_VALUE}
              onValueChange={(v) => setFilterTerritory(v === ALL_VALUE ? '' : v)}
              options={territorySelectOptions}
              placeholder="All territories"
              ariaLabel="Filter by territory"
              className="w-full sm:w-[180px]"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm font-medium text-slate-600">Status</span>
            <Select
              value={filterStatus || ALL_VALUE}
              onValueChange={(v) => setFilterStatus((v === ALL_VALUE ? '' : v) as Location['status'])}
              options={statusSelectOptions}
              placeholder="All statuses"
              ariaLabel="Filter by status"
              className="w-full sm:w-[180px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th
                    className="cursor-pointer px-3 py-2.5 text-left text-xs font-medium uppercase text-slate-600 hover:bg-slate-100 sm:px-4 sm:py-3"
                    onClick={() => handleSort('name')}
                  >
                    Location {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="cursor-pointer px-3 py-2.5 text-left text-xs font-medium uppercase text-slate-600 hover:bg-slate-100 sm:px-4 sm:py-3"
                    onClick={() => handleSort('population')}
                  >
                    Population {sortKey === 'population' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="cursor-pointer px-3 py-2.5 text-left text-xs font-medium uppercase text-slate-600 hover:bg-slate-100 sm:px-4 sm:py-3"
                    onClick={() => handleSort('territory')}
                  >
                    Territory {sortKey === 'territory' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="cursor-pointer px-3 py-2.5 text-left text-xs font-medium uppercase text-slate-600 hover:bg-slate-100 sm:px-4 sm:py-3"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortKey === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="w-12 px-3 py-2.5 sm:px-4 sm:py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((loc) => (
                  <tr key={loc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <button
                        onClick={() => openEditForm(loc)}
                        className="cursor-pointer text-left font-medium text-emerald-700 hover:underline"
                      >
                        {loc.name}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 sm:px-4 sm:py-3">
                      {loc.population.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 sm:px-4 sm:py-3">{loc.territory}</td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: STATUS_COLORS[loc.status] }}
                      >
                        {STATUS_LABELS[loc.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <button
                        onClick={() => setDeleteTarget(loc)}
                        className="cursor-pointer rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-medium">
                  <td className="px-3 py-2.5 text-slate-700 sm:px-4 sm:py-3">Total</td>
                  <td className="px-3 py-2.5 text-slate-700 sm:px-4 sm:py-3">
                    {filteredAndSorted.reduce((sum, loc) => sum + loc.population, 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 sm:px-4 sm:py-3" colSpan={3} />
                </tr>
              </tfoot>
            </table>
          )}
          {!loading && filteredAndSorted.length === 0 && (
            <div className="p-8 text-center text-slate-500">No locations found</div>
          )}
        </div>
      </main>

      <LocationForm
        open={formOpen}
        onClose={handleFormClose}
        location={editingLocation}
        existingTerritories={territoryOptions}
      />
      <DeleteConfirm
        open={!!deleteTarget}
        onClose={handleDeleteClose}
        location={deleteTarget}
      />
    </div>
  )
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if ((c === ',' && !inQuotes) || c === '\n') {
      result.push(current.trim())
      current = ''
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}
