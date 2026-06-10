'use client'

interface Props {
  action: () => Promise<void>
  message?: string
  label?: string
}

export default function DeleteButton({ action, message = 'Are you sure?', label = 'Delete' }: Props) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={e => { if (!confirm(message)) e.preventDefault() }}
        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
      >
        {label}
      </button>
    </form>
  )
}
