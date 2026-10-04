import { Link } from 'react-router-dom'
import useSWR from 'swr'
import ActivityHeatmap from '../components/ActivityHeatmap'
import BookMastery from '../components/BookMastery'
import BrandIcon from '../components/BrandIcon'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import { fetchStats } from '../lib/account'
import { BOT_URL, fetchBooks, fetchFlashcardsOf, type BookWithFolder } from '../lib/api'
import { bookCardScope, deckFolders } from '../lib/deck'
import { plural } from '../lib/format'
import { localBookStats, MASTERY_PARTS } from '../lib/mastery'
import { loadProgress } from '../lib/storage'
import { useAuth } from '../lib/useAuth'
import { useDeck } from '../lib/useDeck'
import type { BookStats, UserStats } from '../types'

// Вкладка «Карточки»: календарь активности, кнопка общего повторения (карточки
// всех книг колоды вперемешку) и книги — у каждой прогресс и запуск повторения
// по ней одной. Вошедшим цифры считает бот (те же в его /status и напоминании),
// гостям — приложение по прогрессу с устройства.
function StudyIndex() {
  const { user, loading: authLoading, inTelegram } = useAuth()
  const { deck, ready: deckReady } = useDeck()
  const folders = deckFolders(deck)

  // Обложки и названия — из меты книг, ключ общий с каталогом.
  const books = useSWR<BookWithFolder[]>('books', fetchBooks)
  const stats = useSWR<UserStats>(user ? `stats:${user.id}` : null, fetchStats)
  // Бот недоступен — считаем по копии на устройстве, как и повторение.
  const local = !user || Boolean(stats.error)
  const cards = useSWR(
    deckReady && local && folders.length > 0 ? `study-cards:${folders.join(',')}` : null,
    () => fetchFlashcardsOf(folders),
  )

  const loading =
    authLoading ||
    !deckReady ||
    books.isLoading ||
    cards.isLoading ||
    (Boolean(user) && !stats.data && !stats.error)
  const error = books.error ?? cards.error

  let list: BookStats[] = []
  if (!loading && !error) {
    list =
      user && stats.data
        ? stats.data.books
        : folders.flatMap((folder) => {
            const meta = books.data?.find((b) => b.folder === folder)?.meta
            if (!meta) return []
            return localBookStats(
              folder,
              meta.title,
              cards.data?.[folder] ?? [],
              bookCardScope(folder, deck),
              loadProgress(folder),
            )
          })
    // У книги ещё нет карточек — показывать и повторять нечего.
    list = list.filter((book) => book.total > 0)
  }
  const inDeck = list.filter((book) => book.in_deck)
  const due = inDeck.reduce((n, book) => n + book.due, 0)
  const coverOf = (folder: string) => books.data?.find((b) => b.folder === folder)?.meta.cover

  // Календарь ведёт бот: у гостя его нет, а до первых повторений и колоды
  // показывать в нём нечего.
  const activity =
    user && stats.data && (stats.data.books.length > 0 || stats.data.reviews.total > 0)
      ? stats.data.activity
      : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Карточки</h1>
        <p className="mt-2 text-ink-soft">
          Интервальное повторение по алгоритму SM-2: отвечай и отмечай, насколько легко
          вспомнил.
        </p>
      </header>

      {!user && !authLoading && !inTelegram ? <GuestNote /> : null}

      {loading ? (
        <div className="mt-8">
          <Loading label="Загружаем карточки…" />
        </div>
      ) : error ? (
        <div className="mt-8">
          <ErrorState message={(error as Error).message} />
        </div>
      ) : (
        <>
          {activity ? (
            <section className="reveal mt-8" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-ink">Активность</h2>
                <span className="text-xs text-ink-faint">12 недель</span>
              </div>
              <div className="card mt-3">
                <ActivityHeatmap activity={activity} />
              </div>
            </section>
          ) : null}

          <div className="reveal mt-8" style={{ '--reveal-delay': '140ms' } as React.CSSProperties}>
            {inDeck.length === 0 ? (
              <EmptyState
                title="Колода пуста"
                hint="Открой книгу и нажми «В колоду» — её карточки появятся здесь, а бот клуба будет напоминать, когда их пора повторить."
                action={
                  <Link to="/books" className="btn-ghost">
                    <Icon name="book" size={16} />
                    К книгам
                  </Link>
                }
              />
            ) : (
              <StartReview due={due} books={inDeck.length} />
            )}
          </div>

          {list.length > 0 ? (
            <section className="reveal mt-8" style={{ '--reveal-delay': '200ms' } as React.CSSProperties}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-lg font-semibold text-ink">По книгам</h2>
                <ul aria-hidden="true" className="flex gap-3 text-xs text-ink-faint">
                  {MASTERY_PARTS.map(({ label, className }) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${className}`} />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 space-y-3">
                {list.map((book) => (
                  <BookMastery key={book.folder} book={book} cover={coverOf(book.folder)} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {user ? <Reminders /> : null}
    </div>
  )
}

// Главное действие вкладки: общая сессия — карточки к повторению из всех книг
// колоды вперемешку. По одной книге повторение запускает её карточка ниже.
function StartReview({ due, books }: { due: number; books: number }) {
  if (due === 0) {
    return (
      <div className="card flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
          <Icon name="check" size={18} />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">На сегодня всё повторено</p>
          <p className="text-sm text-ink-faint">Карточки вернутся, когда подойдёт их срок.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl font-semibold text-ink">
          {due} {plural(due, 'карточка', 'карточки', 'карточек')} к повторению
        </p>
        <p className="mt-0.5 text-sm text-ink-faint">
          {books > 1 ? 'Вперемешку из всех книг колоды' : 'Все карточки, которым подошёл срок'}
        </p>
      </div>
      <Link to="/study/all" className="btn-primary shrink-0">
        <Icon name="play" size={16} />
        Начать повторение
      </Link>
    </div>
  )
}

// Гостю: колода живёт только на этом устройстве, вход делает её общей с ботом.
function GuestNote() {
  return (
    <div
      className="reveal mt-6 flex flex-col gap-3 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center"
      style={{ '--reveal-delay': '60ms' } as React.CSSProperties}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <BrandIcon brand="telegram" size={18} />
      </span>
      <p className="flex-1 text-sm text-ink-soft">
        Колода и прогресс сейчас хранятся только в этом браузере. Войди через Telegram —
        они станут общими с приложением в Telegram, а бот будет напоминать о повторении.
      </p>
      <Link to="/account" className="btn-ghost shrink-0">
        Войти
      </Link>
    </div>
  )
}

// Напоминания живут в боте.
function Reminders() {
  return (
    <section className="reveal mt-8" style={{ '--reveal-delay': '260ms' } as React.CSSProperties}>
      <h2 className="font-display text-lg font-semibold text-ink">Напоминания</h2>
      <div className="card mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-ink-soft">
          Бот клуба пишет в 10:00 МСК, когда в колоде есть карточки к повторению.
          Выключить — /stop, включить снова — /start.
        </p>
        <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost shrink-0">
          <BrandIcon brand="telegram" size={16} />
          Открыть бота
        </a>
      </div>
    </section>
  )
}

export default StudyIndex
