import { useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import EventProgramCard from '../components/EventProgramCard'
import { ALL, FilterBar, FilterSelect } from '../components/Filters'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import Pill from '../components/Pill'
import { bookTitleById, fetchClaims, fetchEvents } from '../lib/api'
import type { TopicClaim } from '../lib/api'
import { EVENT_TYPE_LABEL } from '../types'
import type { ClubEvent, EventType } from '../types'

type Tab = 'plan' | 'archive'

// Вкладка «Встречи»: таймлайн плана и архив с записями. У встреч плана типа
// «доклады» видно слоты тем главы — занятые (спикер/заявка) и свободные.
function Meetings() {
  const { data: events, error, isLoading } = useSWR<ClubEvent[]>('events', fetchEvents)
  // Ошибка заявок не роняет страницу: темы покажем свободными с мелкой подписью.
  const claims = useSWR<TopicClaim[]>('topic-claims', fetchClaims)
  const [tab, setTab] = useState<Tab>('plan')
  const [book, setBook] = useState<string>(ALL)
  const [type, setType] = useState<typeof ALL | EventType>(ALL)
  const [year, setYear] = useState<string>(ALL)

  // Завершённые (явный флаг) — в архив (свежие сверху), остальные — в план
  // (ближайшие сверху). Порядок задаём явно, не полагаясь на порядок загрузки.
  const plan = (events ?? [])
    .filter((e) => !e.finished)
    .sort((a, b) => a.date.localeCompare(b.date))
  const archive = (events ?? [])
    .filter((e) => e.finished)
    .sort((a, b) => b.date.localeCompare(a.date))
  const tabEvents = tab === 'plan' ? plan : archive

  // Варианты фильтров считаем по всей вкладке, а не по отфильтрованному списку:
  // иначе выбор одного фильтра прятал бы кнопки остальных.
  const books: Array<{ id: string; title: string }> = []
  for (const e of tabEvents) {
    if (e.book_id && !books.some((b) => b.id === e.book_id)) {
      books.push({ id: e.book_id, title: bookTitleById(e.book_id) ?? e.book_id })
    }
  }
  const types = (['live-talk', 'closed-chapter'] as EventType[]).filter((t) =>
    tabEvents.some((e) => e.type === t),
  )
  // Годы — от новых к старым: в архиве это основной способ найти встречу.
  const years = [...new Set(tabEvents.map((e) => e.date.slice(0, 4)))].sort((a, b) =>
    b.localeCompare(a),
  )

  const visible = tabEvents.filter(
    (e) =>
      (book === ALL || e.book_id === book) &&
      (type === ALL || e.type === type) &&
      (year === ALL || e.date.startsWith(year)),
  )
  const filtered = book !== ALL || type !== ALL || year !== ALL
  const hasFilters = types.length > 1 || books.length > 1 || years.length > 1

  function resetFilters() {
    setBook(ALL)
    setType(ALL)
    setYear(ALL)
  }

  function switchTab(next: Tab) {
    setTab(next)
    // Фильтры сбрасываем: у плана и архива разные книги, типы и годы.
    resetFilters()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Встречи</h1>
        <p className="mt-2 text-ink-soft">
          План ближайших встреч и архив с записями. Хочешь выступить — выбирай
          свободную тему из плана.
        </p>
        <Link to="/join" className="btn-primary mt-4 px-5 py-2.5 text-sm">
          <Icon name="mic" size={15} />
          Стать спикером
        </Link>
      </header>

      <div
        className="reveal mt-6 flex gap-2"
        style={{ '--reveal-delay': '60ms' } as React.CSSProperties}
      >
        <Pill active={tab === 'plan'} onClick={() => switchTab('plan')}>
          План
        </Pill>
        <Pill active={tab === 'archive'} onClick={() => switchTab('archive')}>
          Архив
        </Pill>
      </div>

      {hasFilters ? (
        <div className="reveal mt-4" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
          <FilterBar onReset={filtered ? resetFilters : undefined}>
            <FilterSelect
              label="Тип встречи"
              allLabel="Все встречи"
              value={type}
              options={types.map((t) => ({ value: t, label: EVENT_TYPE_LABEL[t] }))}
              onChange={setType}
            />
            <FilterSelect
              label="Книга"
              allLabel="Все книги"
              value={book}
              options={books.map((b) => ({ value: b.id, label: b.title }))}
              onChange={setBook}
            />
            <FilterSelect
              label="Год"
              allLabel="Все годы"
              value={year}
              options={years.map((y) => ({ value: y, label: y }))}
              onChange={setYear}
            />
          </FilterBar>
        </div>
      ) : null}

      <div className="mt-8">
        {isLoading ? (
          <Loading label="Загружаем встречи…" />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : visible.length === 0 ? (
          // Пустой фильтр и пустая вкладка — разные ситуации: в первой человеку
          // нужно снять фильтр, а не ждать новых встреч.
          filtered ? (
            <EmptyState
              title="Под фильтр ничего не подошло"
              hint="Попробуйте выбрать другой год, книгу или тип встречи."
            />
          ) : (
            <EmptyState
              title={tab === 'plan' ? 'В плане пока пусто' : 'Архив пока пуст'}
              hint={tab === 'plan' ? 'Скоро появятся новые встречи.' : 'Записи появятся после первых встреч.'}
            />
          )
        ) : (
          <div className="space-y-6">
            {visible.map((event, i) => (
              <TimelineItem
                key={event.id}
                event={event}
                claims={claims.data ?? []}
                claimsUnavailable={Boolean(claims.error)}
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
  claimsUnavailable,
  showSlots,
  delay,
}: {
  event: ClubEvent
  claims: TopicClaim[]
  claimsUnavailable?: boolean
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
        <EventProgramCard
          event={event}
          claims={claims}
          claimsUnavailable={claimsUnavailable}
          showSlots={showSlots}
        />
      </div>
    </div>
  )
}

export default Meetings
