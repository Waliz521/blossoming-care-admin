import * as Dialog from '@radix-ui/react-dialog'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Location } from '../types'

interface DeleteConfirmProps {
  open: boolean
  onClose: () => void
  location: Location | null
}

export function DeleteConfirm({ open, onClose, location }: DeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!location) return
    setDeleting(true)
    const { error } = await supabase.from('locations').delete().eq('id', location.id)
    setDeleting(false)
    if (error) {
      alert('Delete failed: ' + error.message)
    } else {
      onClose()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2000] bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[2001] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-4 shadow-xl sm:p-6">
          <Dialog.Title className="text-lg font-semibold text-slate-800">
            Delete location
          </Dialog.Title>
          <p className="mt-2 text-slate-600">
            Are you sure you want to delete <strong>{location?.name}</strong>? This will
            remove it from the map.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Dialog.Close asChild>
              <button className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
