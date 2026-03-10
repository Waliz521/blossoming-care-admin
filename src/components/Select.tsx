/**
 * Modern dropdown using Radix UI - matches app styling
 */
import * as SelectPrimitive from '@radix-ui/react-select'

const triggerClass =
  'inline-flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 data-[placeholder]:text-slate-500'

const contentClass =
  'z-[3000] w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-h-[280px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg'

const itemClass =
  'relative flex cursor-pointer select-none items-center px-3 py-2 text-sm outline-none data-[highlighted]:bg-emerald-50 data-[highlighted]:text-emerald-800 data-[state=checked]:bg-emerald-50 data-[state=checked]:font-medium'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
  className?: string
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  ariaLabel,
  className = '',
}: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={`${triggerClass} ${className}`}
        aria-label={ariaLabel}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className="ml-auto shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className={contentClass} position="popper" sideOffset={4}>
          <SelectPrimitive.Viewport>
            {options.map(({ value: v, label }) => (
              <SelectPrimitive.Item key={v} value={v} className={itemClass}>
                <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
