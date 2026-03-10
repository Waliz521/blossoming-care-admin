/**
 * Searchable dropdown - uses Popover so search input keeps focus while typing
 */
import * as Popover from '@radix-ui/react-popover'
import { useState, useMemo, useRef, useEffect } from 'react'

const triggerClass =
  'inline-flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 data-[placeholder]:text-slate-500'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  ariaLabel?: string
  className?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  ariaLabel,
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const q = search.trim().toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder

  useEffect(() => {
    if (open) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  function handleSelect(v: string) {
    onValueChange(v)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={`${triggerClass} ${className}`}
        aria-label={ariaLabel}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-500'}>
          {selectedLabel}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="ml-auto shrink-0"
          aria-hidden
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[3000] w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)] max-h-[320px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-slate-100 px-2 pb-2 pt-1">
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoComplete="off"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-500">
                No matches
              </div>
            ) : (
              filteredOptions.map(({ value: v, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleSelect(v)}
                  className="flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm text-slate-800 hover:bg-emerald-50 hover:text-emerald-800 focus:bg-emerald-50 focus:outline-none focus:ring-0 data-[selected]:bg-emerald-50 data-[selected]:font-medium"
                  style={v === value ? { backgroundColor: 'rgb(236 253 245)', fontWeight: 500 } : undefined}
                >
                  {label}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
