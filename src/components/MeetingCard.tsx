import type { Meeting } from '../types'

interface MeetingCardProps {
  meeting: Meeting
}

// Форматирует ISO-дату в читаемый вид на русском.
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Карточка ближайшей встречи клуба (данные-заглушки).
function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📅</span>
        <div>
          <p className="font-semibold text-slate-900">{meeting.title}</p>
          <p className="mt-1 text-sm text-muted">
            {formatDate(meeting.date)} · {meeting.place}
          </p>
          <span className="mt-2 inline-block rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-slate-600">
            {meeting.chapter}
          </span>
        </div>
      </div>
    </div>
  )
}

export default MeetingCard
