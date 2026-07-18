import { bookTitleById, mediaUrl } from '../lib/api'
import { formatEventDate, formatWeekday, isPast } from '../lib/format'
import ClubAvatar from './ClubAvatar'
import Icon from './Icon'
import type { ClubEvent } from '../types'

// Слот темы главы для встречи-«доклады»: занят спикером или свободен.
export interface TopicSlot {
  id: string
  title: string
  speaker?: { name: string; avatar?: string; pending?: boolean }
}

interface EventCardProps {
  event: ClubEvent
  // Для таймлайна плана: слоты тем главы (занятые/свободные) вместо списка докладов.
  topicSlots?: TopicSlot[]
}

// Карточка встречи: открытое обсуждение главы или доклады (запись докладов).
// У будущих — «Пойду» и ссылки; у прошедших/завершённых — записи трансляций.
function EventCard({ event, topicSlots }: EventCardProps) {
  const done = event.finished || isPast(event.date)
  const kind = event.type === 'closed-chapter' ? 'Открытое обсуждение' : 'Доклады'
  const bookTitle = bookTitleById(event.book_id)
  const moderators = event.type === 'closed-chapter' ? (event.moderators ?? []) : []

  return (
    <article className={`card ${done ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-faint">
          <Icon name="calendar" size={15} />
          <span>{kind}</span>
        </div>
        {done ? (
          <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-ink-faint">
            прошла
          </span>
        ) : null}
      </div>

      <h3 className="font-display mt-3 text-lg font-semibold leading-snug text-ink">
        {event.title}
      </h3>

      {bookTitle ? (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <Icon name="book" size={14} />
          {bookTitle}
        </p>
      ) : null}

      <p className="mt-1.5 text-sm text-ink-soft">
        {formatEventDate(event.date)}, {formatWeekday(event.date)} · {event.time}
        {event.type === 'closed-chapter' && event.pages
          ? ` · стр. ${event.pages.from}–${event.pages.to}`
          : ''}
      </p>

      {moderators.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
            {moderators.length > 1 ? 'Модераторы' : 'Модератор'}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {moderators.map((m) => (
              <li key={m.speaker_id} className="flex items-center gap-2">
                {m.avatar ? (
                  <img
                    src={mediaUrl(m.avatar)}
                    alt=""
                    width={28}
                    height={28}
                    loading="lazy"
                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <ClubAvatar size={28} />
                )}
                <span className="text-sm text-ink">{m.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Доклады: слоты тем главы (в плане) либо список подтверждённых докладов. */}
      {event.type === 'live-talk' && topicSlots && topicSlots.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {topicSlots.map((slot) => (
            <li key={slot.id} className="flex items-center gap-3">
              {slot.speaker ? (
                slot.speaker.avatar ? (
                  <img
                    src={mediaUrl(slot.speaker.avatar)}
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
                    {slot.speaker.name.slice(0, 1)}
                  </span>
                )
              ) : (
                <ClubAvatar size={32} />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{slot.title}</p>
                <p className="text-xs text-ink-faint">
                  {slot.speaker
                    ? `${slot.speaker.name}${slot.speaker.pending ? ' · заявка' : ''}`
                    : 'свободная тема'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : event.type === 'live-talk' && event.talks.length > 0 ? (
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
              <div className="min-w-0 grow">
                <p className="truncate text-sm font-medium text-ink">{talk.title}</p>
                <p className="text-xs text-ink-faint">{talk.speaker}</p>
              </div>
              {talk.slides_url ? (
                <a
                  href={talk.slides_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost shrink-0 px-3 py-1.5 text-xs"
                >
                  <Icon name="external" size={13} />
                  Слайды
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!done && event.call_url ? (
          <a
            href={event.call_url}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost px-4 py-2 text-xs"
          >
            <Icon name="external" size={14} />
            Подключиться
          </a>
        ) : null}
        {event.streams?.youtube ? (
          <a
            href={event.streams.youtube}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost px-4 py-2 text-xs"
          >
            <Icon name="play" size={14} />
            {done ? 'Запись YouTube' : 'YouTube'}
          </a>
        ) : null}
        {event.streams?.vk ? (
          <a
            href={event.streams.vk}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost px-4 py-2 text-xs"
          >
            <Icon name="play" size={14} />
            {done ? 'Запись VK' : 'VK Видео'}
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
            Доска
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
    </article>
  )
}

export default EventCard
