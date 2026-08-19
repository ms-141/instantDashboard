import type { ActivityEvent } from '@/types'

interface TimelineEmailInfo {
  status: string
  open_count: number
  click_count: number
}

interface Props {
  events: (ActivityEvent & { email_message?: TimelineEmailInfo | null })[]
}

const ICONS: Record<ActivityEvent['type'], string> = {
  order_created: '📦',
  order_status_changed: '🔄',
  email_sent: '✉️',
  email_opened: '👀',
  email_clicked: '🔗',
  note_added: '📝',
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export default function ActivityTimeline({ events }: Props) {
  if (!events.length) {
    return <p className="text-gray-400 text-sm px-6 py-6 text-center">No activity yet.</p>
  }

  return (
    <ul className="divide-y divide-gray-50">
      {events.map(event => (
        <li key={event.id} className="px-6 py-4 flex gap-3">
          <span className="text-lg leading-none shrink-0" aria-hidden="true">{ICONS[event.type] ?? '•'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">{event.title}</p>
            {event.description && (
              <p className="text-sm text-gray-500 mt-0.5 break-words">{event.description}</p>
            )}
            {event.email_message && (
              <div className="flex gap-2 mt-1.5">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {event.email_message.status}
                </span>
                {event.email_message.open_count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    👀 Opened {event.email_message.open_count}×
                  </span>
                )}
                {event.email_message.click_count > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                    🔗 Clicked {event.email_message.click_count}×
                  </span>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">{formatTimestamp(event.created_at)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
