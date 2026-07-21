import { useState } from 'react'
import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import EventProgramCard from '../components/EventProgramCard'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import { bookTitleById, fetchClaims, fetchEvents, speakerUrl } from '../lib/api'
import type { TopicClaim } from '../lib/api'
import type { ClubEvent } from '../types'

type Tab = 'plan' | 'archive'

// Вкладка «Встречи»: таймлайн плана и архив с записями. У встреч плана типа
// «доклады» видно слоты тем главы — занятые (спикер/заявка) и свободные.
function Meetings() {
  const { data: events, error, isLoading } = useSWR<ClubEvent[]>('events', fetchEvents)
  const { data: claims } = useSWR<TopicClaim[]>('topic-claims', fetchClaims)
  const [tab, setTab] = useState<Tab>('plan')
  const [book, setBook] = useState<string>('all')

  // Завершённые (явный флаг) — в архив (свежие сверху), остальные — в план
  // (ближайшие сверху). Порядок задаём явно, не полагаясь на порядок загрузки.
  const plan = (events ?? [])
    .filter((e) => !e.finished)
    .sort((a, b) => a.date.localeCompare(b.date))
  const archive = (events ?? [])
    .filter((e) => e.finished)
    .sort((a, b) => b.date.localeCompare(a.date))
  const tabEvents = tab === 'plan' ? plan : archive

  // Книги, встречающиеся в текущей вкладке — для фильтра-чипов.
  const books: Array<{ id: string; title: string }> = []
  for (const e of tabEvents) {
    if (e.book_id && !books.some((b) => b.id === e.book_id)) {
      books.push({ id: e.book_id, title: bookTitleById(e.book_id) ?? e.book_id })
    }
  }
  const visible = book === 'all' ? tabEvents : tabEvents.filter((e) => e.book_id === book)

  function switchTab(next: Tab) {
    setTab(next)
    setBook('all') // фильтр сбрасываем — набор книг у вкладок разный
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Встречи</h1>
        <p className="mt-2 text-ink-soft">
          План ближайших встреч и архив с записями. Хочешь выступить — выбирай
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
        <TabButton active={tab === 'plan'} onClick={() => switchTab('plan')}>
          План
        </TabButton>
        <TabButton active={tab === 'archive'} onClick={() => switchTab('archive')}>
          Архив
        </TabButton>
      </div>

      {books.length > 1 ? (
        <div
          className="reveal mt-4 flex flex-wrap gap-2"
          style={{ '--reveal-delay': '80ms' } as React.CSSProperties}
        >
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

      <div className="mt-8">
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
          <div className="space-y-6">
            {visible.map((event, i) => (
              <TimelineItem
                key={event.id}
                event={event}
                claims={claims ?? []}
                showSlots={tab === 'plan'}
                delay={80 + i * 90}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Строка таймлайна: слева дата, справа карточка встречи. В плане третьей строкой
// день недели (когда идти), в архиве — год (дата важнее дня недели).
function TimelineItem({
  event,
  claims,
  showSlots,
  delay,
}: {
  event: ClubEvent
  claims: TopicClaim[]
  showSlots: boolean
  delay: number
}) {
  const date = new Date(`${event.date}T00:00:00`)
  const day = date.getDate()
  const month = date.toLocaleDateString('ru-RU', { month: 'short' }).replace('.', '')
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' })
  const year = date.getFullYear()

  return (
    <div
      className="reveal flex gap-4"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      <div className="w-12 shrink-0 pt-4 text-right sm:w-14">
        <div className="font-display text-2xl font-semibold leading-none text-ink">{day}</div>
        <div className="mt-1 text-xs uppercase tracking-wide text-ink-faint">{month}</div>
        <div className="text-xs text-ink-faint">{showSlots ? weekday : year}</div>
      </div>
      <div className="relative min-w-0 grow border-l border-line pl-5">
        <span className="absolute -left-1.25 top-5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-canvas" />
        <EventProgramCard event={event} claims={claims} showSlots={showSlots} />
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
          ? 'rounded-full bg-ink px-3 py-1 text-xs font-medium text-canvas'
          : 'rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-faint transition-colors duration-200 hover:text-ink'
      }
    >
      {children}
    </button>
  )
}

export default Meetings
