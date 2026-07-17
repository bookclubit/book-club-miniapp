import { eventJoinUrl, mediaUrl, speakerRegistrationUrl } from '../lib/api'
import { formatEventDate, formatWeekday, isPast } from '../lib/format'
import Icon from './Icon'
import type { ClubEvent } from '../types'

interface EventCardProps {
  event: ClubEvent
}

// Карточка встречи клуба: закрытый разбор главы или открытый эфир с докладами.
function EventCard({ event }: EventCardProps) {
  const past = isPast(event.date)
  const kind =
    event.type === 'closed-chapter' ? 'Закрытая встреча' : 'Открытый эфир'

  return (
    <article className={`card ${past ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-faint">
          <Icon name="calendar" size={15} />
          <span>{kind}</span>
        </div>
        {past ? (
          <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-ink-faint">
            прошла
          </span>
        ) : null}
      </div>

      <h3 className="font-display mt-3 text-lg font-semibold leading-snug text-ink">
        {event.title}
      </h3>

      <p className="mt-1.5 text-sm text-ink-soft">
        {formatEventDate(event.date)}, {formatWeekday(event.date)} · {event.time}
        {event.type === 'closed-chapter' && event.pages
          ? ` · стр. ${event.pages.from}–${event.pages.to}`
          : ''}
      </p>

      {event.type === 'live-talk' && event.talks.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {event.talks.map((talk) => (
            <li key={talk.speaker_id + talk.title} className="flex items-center gap-3">
              {talk.avatar ? (
                <img
                  src={mediaUrl(talk.avatar)}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-semibold text-ink-faint"
                >
                  {talk.speaker.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{talk.title}</p>
                <p className="text-xs text-ink-faint">{talk.speaker}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {!past ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={eventJoinUrl(event.id)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary px-4 py-2 text-xs"
          >
            <Icon name="check" size={14} />
            Пойду
          </a>
          {event.type === 'live-talk' ? (
            <a
              href={speakerRegistrationUrl(event.id)}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-4 py-2 text-xs"
            >
              <Icon name="send" size={14} />
              Стать спикером
            </a>
          ) : null}
          {event.call_url ? (
            <a
              href={event.call_url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-4 py-2 text-xs"
            >
              <Icon name="external" size={14} />
              Созвон
            </a>
          ) : null}
          {event.type === 'live-talk' && event.streams?.youtube ? (
            <a
              href={event.streams.youtube}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-4 py-2 text-xs"
            >
              <Icon name="play" size={14} />
              YouTube
            </a>
          ) : null}
          {event.type === 'live-talk' && event.streams?.vk ? (
            <a
              href={event.streams.vk}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-4 py-2 text-xs"
            >
              <Icon name="play" size={14} />
              VK Видео
            </a>
          ) : null}
          {event.type === 'closed-chapter' && event.notes_board_url ? (
            <a
              href={event.notes_board_url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-4 py-2 text-xs"
            >
              <Icon name="external" size={14} />
              Доска заметок
            </a>
          ) : null}
          {(event.materials ?? []).map((m) => (
            <a
              key={m.url}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost px-4 py-2 text-xs"
            >
              <Icon name="file" size={14} />
              {m.title}
            </a>
          ))}
        </div>
      ) : null}
    </article>
  )
}

export default EventCard
