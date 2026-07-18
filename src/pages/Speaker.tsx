import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import BrandIcon from '../components/BrandIcon'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import { bookTitleById, fetchEvents, fetchSpeakers, mediaUrl } from '../lib/api'
import { collectSpeakerTalks } from '../lib/speakers'
import { SPEAKER_SOCIALS } from '../types'
import type { ClubEvent, IndexSpeaker } from '../types'

// Профиль спикера: описание, соцсети, доклады (новые → старые) с фильтром по книгам.
function Speaker() {
  const { id = '' } = useParams()
  const speakers = useSWR<IndexSpeaker[]>('speakers', fetchSpeakers)
  const events = useSWR<ClubEvent[]>('events', fetchEvents)
  const [book, setBook] = useState<string>('all')

  if (speakers.isLoading || events.isLoading) {
    return <Centered><Loading label="Загружаем профиль…" /></Centered>
  }
  if (speakers.error) {
    return <Centered><ErrorState message={(speakers.error as Error).message} /></Centered>
  }

  const speaker = speakers.data?.find((s) => s.id === id)
  if (!speaker) {
    return (
      <Centered>
        <EmptyState title="Спикер не найден" hint="Возможно, ссылка устарела." />
        <Link to="/speakers" className="link-back group mt-6 text-sm">
          <Icon name="arrow-left" size={14} />
          Все спикеры
        </Link>
      </Centered>
    )
  }

  const talks = collectSpeakerTalks(events.data ?? [], speaker.id)

  // Книги, в которых спикер участвовал (для фильтра).
  const books: Array<{ id: string; title: string }> = []
  for (const t of talks) {
    if (t.bookId && !books.some((b) => b.id === t.bookId)) {
      books.push({ id: t.bookId, title: bookTitleById(t.bookId) ?? t.bookId })
    }
  }

  const visible = book === 'all' ? talks : talks.filter((t) => t.bookId === book)

  const socials = SPEAKER_SOCIALS.map((s) => ({
    ...s,
    url: speaker.socials?.[s.id]?.trim(),
  })).filter((s): s is { id: (typeof s)['id']; label: string; url: string } => Boolean(s.url))

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/speakers" className="link-back group text-sm">
        <Icon name="arrow-left" size={14} />
        Все спикеры
      </Link>

      <header className="reveal mt-6 flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        <img
          src={mediaUrl(speaker.avatar)}
          alt={`Аватар ${speaker.name}`}
          width={112}
          height={112}
          className="h-28 w-28 shrink-0 rounded-full object-cover ring-2 ring-line"
        />
        <div className="mt-4 min-w-0 sm:mt-0">
          <h1 className="font-display text-3xl font-semibold text-ink">{speaker.name}</h1>
          {speaker.bio ? (
            <p className="mt-2 leading-relaxed text-ink-soft">{speaker.bio}</p>
          ) : null}
          {socials.length > 0 ? (
            <div className="mt-4 flex items-center justify-center gap-4 sm:justify-start">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="text-ink-faint transition-colors duration-200 hover:text-ink"
                >
                  <BrandIcon brand={s.id} size={24} />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      <section className="reveal mt-10" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
        <h2 className="font-display text-2xl font-semibold text-ink">Доклады</h2>

        {books.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip active={book === 'all'} onClick={() => setBook('all')}>
              Все книги
            </FilterChip>
            {books.map((b) => (
              <FilterChip key={b.id} active={book === b.id} onClick={() => setBook(b.id)}>
                {b.title}
              </FilterChip>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          {visible.length === 0 ? (
            <EmptyState title="Докладов пока нет" hint="Скоро появятся выступления." />
          ) : (
            <ul className="space-y-4">
              {visible.map((t, i) => (
                <li
                  key={t.eventId + t.talkTitle}
                  className="reveal card"
                  style={{ '--reveal-delay': `${100 + i * 70}ms` } as React.CSSProperties}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
                      {formatTalkDate(t.date)}
                    </span>
                    {bookTitleById(t.bookId) ? (
                      <span className="shrink-0 rounded-full bg-canvas px-2.5 py-0.5 text-xs text-ink-faint">
                        {bookTitleById(t.bookId)}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="font-display mt-2 text-lg font-semibold leading-snug text-ink">
                    {t.talkTitle}
                  </h3>
                  <p className="mt-1 text-sm text-ink-soft">{t.eventTitle}</p>
                  {t.slidesUrl || t.youtube || t.vk ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {t.slidesUrl ? (
                        <a href={t.slidesUrl} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2 text-xs">
                          <Icon name="external" size={14} />
                          Слайды
                        </a>
                      ) : null}
                      {t.youtube ? (
                        <a href={t.youtube} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2 text-xs">
                          <Icon name="play" size={14} />
                          {t.finished ? 'Запись YouTube' : 'YouTube'}
                        </a>
                      ) : null}
                      {t.vk ? (
                        <a href={t.vk} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2 text-xs">
                          <Icon name="play" size={14} />
                          {t.finished ? 'Запись VK' : 'VK Видео'}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function formatTalkDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent'
          : 'rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink-faint transition-colors duration-200 hover:text-ink'
      }
    >
      {children}
    </button>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">{children}</div>
}

export default Speaker
