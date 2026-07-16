'use client'

interface Props {
  action: () => Promise<void>
  message?: string
  label?: string
  className?: string
}

const defaultClassName =
  'bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors'

export default function DeleteButton({
  action,
  message = 'Are you sure?',
  label = 'Delete',
  className = defaultClassName,
}: Props) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={e => { if (!confirm(message)) e.preventDefault() }}
        className={className}
      >
        {label}
      </button>
    </form>
  )
}
