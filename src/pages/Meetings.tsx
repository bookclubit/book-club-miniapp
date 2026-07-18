import { useState } from 'react'
import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import EventCard from '../components/EventCard'
import type { TopicSlot } from '../components/EventCard'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import {
  fetchClaims,
  fetchEventChapterTopics,
  fetchEvents,
  mediaUrl,
  speakerAvatar,
  speakerUrl,
} from '../lib/api'
import type { TopicClaim } from '../lib/api'
import type { ClubEvent, TopicRef } from '../types'

type Tab = 'plan' | 'archive'

// Вкладка «Встречи»: таймлайн плана и архив с записями. У встреч плана типа
// «доклады» видно слоты тем главы — занятые (спикер/заявка) и свободные.
function Meetings() {
  const { data: events, error, isLoading } = useSWR<ClubEvent[]>('events', fetchEvents)
  const { data: claims } = useSWR<TopicClaim[]>('topic-claims', fetchClaims)
  const [tab, setTab] = useState<Tab>('plan')

  // Завершённые (явный флаг) — в архив, остальные — в план.
  const plan = (events ?? []).filter((e) => !e.finished)
  const archive = (events ?? []).filter((e) => e.finished).reverse()
  const visible = tab === 'plan' ? plan : archive

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
        <TabButton active={tab === 'plan'} onClick={() => setTab('plan')}>
          План
        </TabButton>
        <TabButton active={tab === 'archive'} onClick={() => setTab('archive')}>
          Архив
        </TabButton>
      </div>

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

// Строка таймлайна: слева дата, справа карточка встречи.
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

  return (
    <div
      className="reveal flex gap-4"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      <div className="w-12 shrink-0 pt-4 text-right sm:w-14">
        <div className="font-display text-2xl font-semibold leading-none text-ink">{day}</div>
        <div className="mt-1 text-xs uppercase tracking-wide text-ink-faint">{month}</div>
        <div className="text-xs text-ink-faint">{weekday}</div>
      </div>
      <div className="relative min-w-0 grow border-l border-line pl-5">
        <span className="absolute -left-1.25 top-5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-canvas" />
        <EventBody event={event} claims={claims} showSlots={showSlots} />
      </div>
    </div>
  )
}

// Карточка встречи; для «докладов» плана подгружает слоты тем главы.
function EventBody({
  event,
  claims,
  showSlots,
}: {
  event: ClubEvent
  claims: TopicClaim[]
  showSlots: boolean
}) {
  const withTopics =
    showSlots && event.type === 'live-talk' && Boolean(event.book_id && event.chapter)

  const { data: topics } = useSWR<TopicRef[]>(
    withTopics ? `plan-topics:${event.book_id}:${event.chapter}` : null,
    () => fetchEventChapterTopics(event.book_id!, event.chapter!),
  )

  // Слот занят либо заявкой из бота (D1), либо докладом, назначенным в CMS.
  const talks = event.type === 'live-talk' ? event.talks : []
  const slots: TopicSlot[] | undefined = topics?.map((topic) => {
    const claim = claims.find((c) => c.topic_id === topic.id)
    const talk = talks.find((t) => t.topic_id === topic.id || t.title === topic.title)
    const speaker = claim
      ? {
          name: claim.speaker,
          avatar: speakerAvatar(claim.speaker),
          pending: claim.status !== 'confirmed',
        }
      : talk
        ? { name: talk.speaker, avatar: mediaUrl(talk.avatar) ?? speakerAvatar(talk.speaker) }
        : undefined
    return { id: topic.id, title: topic.title, speaker }
  })

  return <EventCard event={event} topicSlots={slots} />
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

export default Meetings
