import { useState } from 'react'
import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import EventCard from '../components/EventCard'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import {
  fetchClaims,
  fetchEventChapterTopics,
  fetchEvents,
  speakerUrl,
} from '../lib/api'
import type { TopicClaim } from '../lib/api'
import type { ClubEvent, TopicRef } from '../types'

type Tab = 'plan' | 'archive'

// Вкладка «Встречи»: план на месяц± и архив с записями. У встреч плана видно
// программу главы и занятость тем (кто уже взял доклад, на что есть заявка).
function Meetings() {
  const { data: events, error, isLoading } = useSWR<ClubEvent[]>('events', fetchEvents)
  const { data: claims } = useSWR<TopicClaim[]>('topic-claims', fetchClaims)
  const [tab, setTab] = useState<Tab>('plan')

  const today = new Date().toISOString().slice(0, 10)
  const plan = (events ?? []).filter((e) => e.date >= today)
  const archive = (events ?? []).filter((e) => e.date < today).reverse()
  const visible = tab === 'plan' ? plan : archive

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Встречи</h1>
        <p className="mt-2 text-ink-soft">
          План на ближайший месяц и архив с записями. Хочешь выступить — выбирай
          свободную тему из плана.
        </p>
        <a
          href={speakerUrl()}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-4 px-5 py-2.5 text-sm"
        >
          <Icon name="send" size={15} />
          Стать спикером
        </a>
      </header>

      <div
        className="reveal mt-6 flex gap-2"
        style={{ '--reveal-delay': '60ms' } as React.CSSProperties}
      >
        <TabButton active={tab === 'plan'} onClick={() => setTab('plan')}>
          План
        </TabButton>
        <TabButton active={tab === 'archive'} onClick={() => setTab('archive')}>
          Архив
        </TabButton>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <Loading label="Загружаем встречи…" />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : visible.length === 0 ? (
          <EmptyState
            title={tab === 'plan' ? 'В плане пока пусто' : 'Архив пока пуст'}
            hint={tab === 'plan' ? 'Скоро появятся новые встречи.' : 'Записи появятся после первых встреч.'}
          />
        ) : (
          <div className="space-y-4">
            {visible.map((event, i) => (
              <div
                key={event.id}
                className="reveal"
                style={{ '--reveal-delay': `${80 + i * 90}ms` } as React.CSSProperties}
              >
                <EventCard event={event} />
                {tab === 'plan' && event.book_id && event.chapter ? (
                  <TopicAvailability
                    bookId={event.book_id}
                    chapterSlug={event.chapter}
                    claims={claims ?? []}
                  />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
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

// Программа главы с занятостью тем (заявки/брони — из D1 бота).
function TopicAvailability({
  bookId,
  chapterSlug,
  claims,
}: {
  bookId: string
  chapterSlug: string
  claims: TopicClaim[]
}) {
  const { data: topics } = useSWR<TopicRef[]>(`plan-topics:${bookId}:${chapterSlug}`, () =>
    fetchEventChapterTopics(bookId, chapterSlug),
  )
  if (!topics || topics.length === 0) return null

  return (
    <div className="mt-2 rounded-card border border-line bg-surface px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
        Темы главы
      </p>
      <ul className="mt-3 space-y-2">
        {topics.map((topic) => {
          const claim = claims.find((c) => c.topic_id === topic.id)
          return (
            <li key={topic.id} className="flex items-center justify-between gap-3 text-sm">
              <span className={claim ? 'text-ink-faint' : 'text-ink'}>{topic.title}</span>
              {claim ? (
                <span className="shrink-0 text-xs text-ink-faint">
                  {claim.status === 'confirmed' ? '🔒 занята' : '🕐 заявка'} · {claim.speaker}
                </span>
              ) : (
                <span className="shrink-0 text-xs font-medium text-accent">свободна</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Meetings
