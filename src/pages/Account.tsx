import { Link } from 'react-router-dom'
import useSWR from 'swr'
import BrandIcon from '../components/BrandIcon'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import TalkList from '../components/TalkList'
import TelegramBotLogin from '../components/TelegramBotLogin'
import {
  bookTitleById,
  fetchAllChapters,
  fetchClaims,
  fetchEvents,
  fetchSpeakers,
  type ChapterTopics,
  type TopicClaim,
} from '../lib/api'
import { fetchMembership, type Membership } from '../lib/account'
import { formatEventDate, formatWeekday, plural } from '../lib/format'
import { collectSpeakerTalks, collectUpcomingTalks, type UpcomingTalk } from '../lib/speakers'
import { useAuth } from '../lib/useAuth'
import type { ClubEvent, IndexSpeaker } from '../types'

// Профиль: кто вошёл и его доклады — следующий и уже прочитанные.
// Колода и статистика изучения — на вкладке «Карточки».
function Account() {
  const { user, loading, inTelegram, completeLogin, logout } = useAuth()

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Loading label="Загружаем аккаунт…" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <BrandIcon brand="telegram" size={28} />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold text-ink">Аккаунт клуба</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">
          Войди через Telegram — колода, прогресс и статистика станут общими для сайта
          и приложения в Telegram, а бот будет напоминать о повторении.
        </p>
        <div className="mt-6">
          {inTelegram ? (
            <p className="text-sm text-ink-faint">Входим автоматически…</p>
          ) : (
            <TelegramBotLogin onLogin={completeLogin} />
          )}
        </div>
      </div>
    )
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Участник клуба'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="reveal flex items-center gap-4">
        {user.photo_url ? (
          <img
            src={user.photo_url}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-line"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-faint">
            <Icon name="users" size={28} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink">{name}</h1>
          {user.username ? <p className="text-sm text-ink-faint">@{user.username}</p> : null}
        </div>
      </header>

      <MyTalks />

      <section className="reveal mt-10" style={{ '--reveal-delay': '200ms' } as React.CSSProperties}>
        <Link to="/study" className="card card-hover group flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
            <Icon name="cards" size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Карточки и статистика</span>
            <span className="block text-sm text-ink-faint">
              Колода, повторение и прогресс — на вкладке «Карточки»
            </span>
          </span>
          <Icon
            name="arrow-right"
            size={16}
            className="shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
          />
        </Link>
      </section>

      <button type="button" onClick={logout} className="btn-ghost mt-8 text-sm">
        <Icon name="arrow-left" size={15} />
        Выйти
      </button>
    </div>
  )
}

// --- Доклады: следующий и состоявшиеся ---

/**
 * «Я» как спикер каталога. Кто это, знает бот (`/api/membership`): человек из
 * `speakers.json` либо участник с одобренной заявкой — у второго записи в
 * каталоге нет, и его заявки находятся по имени, под которым он их подал.
 */
function selfSpeaker(membership: Membership, speakers: IndexSpeaker[]): IndexSpeaker | null {
  const catalog = speakers.find((s) => s.id === membership.speaker?.id)
  if (catalog) {
    return membership.full_name && membership.full_name !== catalog.name
      ? { ...catalog, aliases: [...catalog.aliases, membership.full_name] }
      : catalog
  }
  const name = membership.speaker?.name ?? membership.full_name
  if (!name) return null
  return { id: membership.speaker?.id ?? '', name, aliases: [], avatar: '' }
}

function MyTalks() {
  // Ключи общие со страницами «Стать спикером» и профилем спикера.
  const membership = useSWR<Membership>('membership', fetchMembership)
  const member = Boolean(membership.data?.registered)
  const speakers = useSWR<IndexSpeaker[]>(member ? 'speakers' : null, fetchSpeakers)
  const events = useSWR<ClubEvent[]>(member ? 'events' : null, fetchEvents)
  const claims = useSWR<TopicClaim[]>(member ? 'topic-claims' : null, fetchClaims)
  const chapters = useSWR<ChapterTopics[]>(member ? 'chapters-all' : null, fetchAllChapters)

  if (membership.isLoading) {
    return (
      <section className="mt-10">
        <Loading label="Загружаем доклады…" />
      </section>
    )
  }
  if (membership.error || !membership.data) {
    return (
      <section className="mt-10">
        <ErrorState
          message={membership.error ? (membership.error as Error).message : 'Профиль недоступен'}
        />
      </section>
    )
  }
  // Темы берут участники клуба — остальным показываем, как им стать.
  if (!member) return <JoinCard status={membership.data.status} />

  if (speakers.isLoading || events.isLoading || claims.isLoading || chapters.isLoading) {
    return (
      <section className="mt-10">
        <Loading label="Загружаем доклады…" />
      </section>
    )
  }
  const failed = speakers.error ?? events.error
  if (failed) {
    return (
      <section className="mt-10">
        <ErrorState message={(failed as Error).message} />
      </section>
    )
  }

  const me = selfSpeaker(membership.data, speakers.data ?? [])
  const upcoming = me ? collectUpcomingTalks(events.data ?? [], me, claims.data ?? []) : []
  const past = me
    ? collectSpeakerTalks(events.data ?? [], me, claims.data ?? [], chapters.data ?? [])
    : []
  const publicId = speakers.data?.find((s) => s.id === me?.id)?.id

  return (
    <>
      <section className="reveal mt-10" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
        <h2 className="font-display text-lg font-semibold text-ink">
          {upcoming.length > 1 ? 'Ближайшие доклады' : 'Следующий доклад'}
        </h2>
        {claims.error ? (
          <p className="mt-2 text-xs text-ink-faint">
            Заявки на доклады временно недоступны — попробуй обновить страницу позже.
          </p>
        ) : upcoming.length === 0 ? (
          <div className="card mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-ink-soft">
              Темы на ближайшие эфиры у тебя пока нет. Свободные темы — в плане докладов.
            </p>
            <Link to="/join" className="btn-ghost shrink-0">
              <Icon name="mic" size={16} />
              Выбрать тему
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {upcoming.map((talk) => (
              <UpcomingCard key={talk.eventId + talk.talkTitle} talk={talk} />
            ))}
          </div>
        )}
      </section>

      <section className="reveal mt-10" style={{ '--reveal-delay': '140ms' } as React.CSSProperties}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Ваши доклады</h2>
          {past.length > 0 ? (
            <span className="text-xs text-ink-faint">
              {past.length} {plural(past.length, 'доклад', 'доклада', 'докладов')}
            </span>
          ) : null}
        </div>
        {past.length === 0 ? (
          <p className="mt-2 text-sm text-ink-faint">
            Здесь появятся твои выступления — со слайдами и записями.
          </p>
        ) : (
          <div className="mt-1">
            <TalkList talks={past} />
          </div>
        )}
        {publicId ? (
          <p className="mt-3 text-sm">
            <Link to={`/speaker/${publicId}`} className="link-inline">
              Как профиль видят другие
            </Link>
          </p>
        ) : null}
      </section>
    </>
  )
}

function UpcomingCard({ talk }: { talk: UpcomingTalk }) {
  const book = bookTitleById(talk.bookId)
  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-accent-strong">
          <Icon name="calendar" size={14} />
          {formatEventDate(talk.date)}, {formatWeekday(talk.date)} · {talk.time} МСК
        </span>
        {talk.pending ? (
          <span className="rounded-full bg-warn-soft px-2.5 py-0.5 font-semibold text-warn">
            заявка у админа
          </span>
        ) : (
          <span className="rounded-full bg-success-soft px-2.5 py-0.5 font-semibold text-success">
            подтверждён
          </span>
        )}
      </div>
      <h3 className="font-display mt-2 text-lg font-semibold leading-snug text-ink">
        {talk.talkTitle}
      </h3>
      <p className="mt-1 text-sm text-ink-faint">
        {talk.stream ? `Книжный клуб ${talk.stream}` : talk.eventTitle}
        {book ? ` · ${book}` : ''}
      </p>
    </div>
  )
}

// Не участник клуба: что с заявкой и куда идти дальше.
function JoinCard({ status }: { status: Membership['status'] }) {
  const pending = status === 'pending'
  return (
    <section className="reveal mt-10" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
      <h2 className="font-display text-lg font-semibold text-ink">Доклады</h2>
      <div className="card mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-ink-soft">
          {pending
            ? 'Заявка на участие у админа. Как только её одобрят, бот напишет — и здесь появятся твои доклады.'
            : status === 'declined'
              ? 'Прошлую заявку на участие не одобрили — её можно отправить заново.'
              : 'Темы докладов берут участники клуба. Отправь заявку — и сможешь выбрать тему.'}
        </p>
        <Link to="/join" className="btn-ghost shrink-0">
          <Icon name="mic" size={16} />
          {pending ? 'Моя заявка' : 'Стать спикером'}
        </Link>
      </div>
    </section>
  )
}

export default Account
