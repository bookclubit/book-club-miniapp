import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import BrandIcon from '../components/BrandIcon'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import MaterialLinks, { type Material } from '../components/MaterialLinks'
import Pill from '../components/Pill'
import {
  bookTitleById,
  fetchAllChapters,
  fetchClaims,
  fetchEvents,
  fetchSpeakers,
  mediaUrl,
} from '../lib/api'
import type { ChapterTopics, TopicClaim } from '../lib/api'
import { collectSpeakerTalks, type SpeakerTalk } from '../lib/speakers'
import { SPEAKER_SOCIALS } from '../types'
import type { ClubEvent, IndexSpeaker } from '../types'

// Профиль спикера: описание, соцсети, доклады (новые → старые) с фильтром по книгам.
function Speaker() {
  const { id = '' } = useParams()
  const speakers = useSWR<IndexSpeaker[]>('speakers', fetchSpeakers)
  const events = useSWR<ClubEvent[]>('events', fetchEvents)
  // Ошибка заявок не роняет профиль: покажем только подтверждённые доклады.
  const claims = useSWR<TopicClaim[]>('topic-claims', fetchClaims)
  // Прошлые доклады записаны в темах глав — без них профиль пустой.
  const chapters = useSWR<ChapterTopics[]>('chapters-all', fetchAllChapters)
  const [book, setBook] = useState<string>('all')
  const [year, setYear] = useState<string>('all')

  if (speakers.isLoading || events.isLoading || chapters.isLoading) {
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

  const talks = collectSpeakerTalks(
    events.data ?? [],
    speaker,
    claims.data ?? [],
    chapters.data ?? [],
  )

  // Книги, в которых спикер участвовал (для фильтра).
  const books: Array<{ id: string; title: string }> = []
  for (const t of talks) {
    if (t.bookId && !books.some((b) => b.id === t.bookId)) {
      books.push({ id: t.bookId, title: bookTitleById(t.bookId) ?? t.bookId })
    }
  }

  // Годы докладов (для фильтра) — от новых к старым. У доклада без встречи
  // даты нет: такой в фильтр по году не попадает.
  const years = [
    ...new Set(talks.map((t) => t.date?.slice(0, 4)).filter((y): y is string => Boolean(y))),
  ].sort((a, b) => b.localeCompare(a))

  const visible = talks.filter(
    (t) =>
      (book === 'all' || t.bookId === book) &&
      (year === 'all' || t.date?.slice(0, 4) === year),
  )

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

        {claims.error ? (
          <p className="mt-2 text-xs text-ink-faint">
            Заявки на доклады временно недоступны — показаны только подтверждённые доклады.
          </p>
        ) : null}

        {books.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Pill active={book === 'all'} onClick={() => setBook('all')}>
              Все книги
            </Pill>
            {books.map((b) => (
              <Pill key={b.id} active={book === b.id} onClick={() => setBook(b.id)}>
                {b.title}
              </Pill>
            ))}
          </div>
        ) : null}

        {years.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill active={year === 'all'} onClick={() => setYear('all')}>
              Все годы
            </Pill>
            {years.map((y) => (
              <Pill key={y} active={year === y} onClick={() => setYear(y)}>
                {y}
              </Pill>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          {visible.length === 0 ? (
            <EmptyState title="Докладов пока нет" hint="Скоро появятся выступления." />
          ) : (
            // Список с разделителями, материалы иконками — как темы главы:
            // один и тот же доклад не должен выглядеть в двух местах по-разному.
            <ul className="card divide-y divide-line p-0">
              {visible.map((t, i) => (
                <li
                  key={t.eventId + t.talkTitle}
                  className="reveal px-5 py-4"
                  style={{ '--reveal-delay': `${100 + i * 60}ms` } as React.CSSProperties}
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
                    <span>
                      {t.date
                        ? formatTalkDate(t.date)
                        : t.chapterOrder
                          ? `Глава ${t.chapterOrder}`
                          : 'Доклад'}
                    </span>
                    {bookTitleById(t.bookId) ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{bookTitleById(t.bookId)}</span>
                      </>
                    ) : null}
                    {t.pending ? (
                      <span className="rounded-full bg-canvas px-2 py-0.5">заявка</span>
                    ) : null}
                  </div>

                  {/* Название во всю ширину, встреча и материалы — строкой под ним. */}
                  <h3 className="font-display mt-1 text-base font-semibold leading-snug text-ink">
                    {t.talkTitle}
                  </h3>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="min-w-0 text-xs text-ink-faint">{t.eventTitle}</p>
                    <MaterialLinks items={talkMaterials(t)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

// Материалы доклада: слайды и записи. Пока встреча не прошла, «запись» —
// ссылка на будущий эфир, поэтому подпись зависит от статуса встречи.
function talkMaterials(talk: SpeakerTalk): Material[] {
  return [
    ...(talk.slidesUrl
      ? [{ kind: 'slides' as const, href: talk.slidesUrl, label: 'Слайды доклада' }]
      : []),
    ...(talk.youtube
      ? [
          {
            kind: 'youtube' as const,
            href: talk.youtube,
            label: talk.finished ? 'Запись на YouTube' : 'Эфир на YouTube',
          },
        ]
      : []),
    ...(talk.vk
      ? [
          {
            kind: 'vk' as const,
            href: talk.vk,
            label: talk.finished ? 'Запись в VK' : 'Эфир в VK',
          },
        ]
      : []),
  ]
}

function formatTalkDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">{children}</div>
}

export default Speaker
