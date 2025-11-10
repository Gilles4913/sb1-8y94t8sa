import { useState } from 'react'

export default function HelpHint({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="my-3">
      <button
        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
        onClick={() => setOpen(o => !o)}
      >
        {open ? 'Masquer l’aide' : 'Afficher l’aide'} — {title}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border p-3 text-sm text-gray-700 dark:text-gray-200 dark:border-zinc-700 dark:bg-zinc-900">
          {children}
        </div>
      )}
    </div>
  )
}
