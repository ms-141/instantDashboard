'use client'

import { useTransition } from 'react'
import { toggleAutomation } from '@/app/actions/automations'

export default function AutomationToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleAutomation(id, !enabled))}
      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ${
        enabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {enabled ? 'Enabled' : 'Disabled'}
    </button>
  )
}
