import { Link } from 'react-router-dom'
import useSWR from 'swr'
import BrandIcon from '../components/BrandIcon'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import StudyStats from '../components/StudyStats'
import { fetchServerProgress, serverToStudyProgress, type ServerCardProgress } from '../lib/account'
import { fetchBooks, fetchFlashcards, mediaUrl, type BookWithFolder } from '../lib/api'
import { bookCardScope, cardsInScope, deckFolders } from '../lib/deck'
import { plural } from '../lib/format'
import { isDue, loadProgress } from '../lib/storage'
import { useAuth } from '../lib/useAuth'
import { useDeck } from '../lib/useDeck'
import type { Flashcard } from '../types'

interface StudyBook {
  folder: string
  title: string
  cover?: string
  total: number
  due: number
}

// Карточки книг колоды одним запросом-пачкой: хуки SWR нельзя звать в цикле.
async function fetchCardsOf(folders: string[]): Promise<Record<string, Flashcard[]>> {
  const entries = await Promise.all(
    folders.map(async (folder) => [folder, await fetchFlashcards(folder)] as const),
  )
  return Object.fromEntries(entries)
}

// Вкладка «Карточки»: книги колоды — сколько карточек и сколько к повторению.
// У вошедших колода и прогресс с сервера (общие с ботом — цифры совпадают
// с его напоминанием), у гостей — с устройства.
function StudyIndex() {
  const { user, loading: authLoading, inTelegram } = useAuth()
  const { deck, ready: deckReady } = useDeck()
  const folders = deckFolders(deck)

  const books = useSWR<BookWithFolder[]>('books', fetchBooks)
  const cards = useSWR(
    deckReady && folders.length > 0 ? `study-cards:${folders.join(',')}` : null,
    () => fetchCardsOf(folders),
  )
  // Ключ общий со страницей повторения: оценки там сразу видны здесь.
  const server = useSWR<ServerCardProgress[]>(
    user ? `server-progress:${user.id}` : null,
    fetchServerProgress,
  )

  const loading =
    authLoading ||
    !deckReady ||
    books.isLoading ||
    cards.isLoading ||
    (Boolean(user) && server.isLoading)
  const error = books.error ?? cards.error

  let list: StudyBook[] = []
  if (!loading && !error && books.data && (folders.length === 0 || cards.data)) {
    list = folders
      .map((folder): StudyBook | null => {
        const meta = books.data?.find((b) => b.folder === folder)?.meta
        const deckCards = cardsInScope(cards.data?.[folder] ?? [], bookCardScope(folder, deck))
        if (!meta || deckCards.length === 0) return null
        // Сервер недоступен — считаем по копии на устройстве, как и повторение.
        const progress =
          user && server.data ? serverToStudyProgress(server.data, folder) : loadProgress(folder)
        return {
          folder,
          title: meta.title,
          cover: meta.cover,
          total: deckCards.length,
          due: deckCards.filter((card) => isDue(progress[card.id])).length,
        }
      })
      .filter((book): book is StudyBook => book !== null)
  }

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

      <div className="mt-8">
        {loading ? (
          <Loading label="Загружаем карточки…" />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : list.length === 0 ? (
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
          <div className="space-y-3">
            {list.map((book, i) => (
              <Link
                key={book.folder}
                to={`/study/${book.folder}`}
                className="card card-hover reveal group flex items-center gap-4"
                style={{ '--reveal-delay': `${80 + i * 90}ms` } as React.CSSProperties}
              >
                {book.cover ? (
                  <img
                    src={mediaUrl(book.cover)}
                    alt=""
                    width={44}
                    height={62}
                    loading="lazy"
                    className="h-15.5 w-11 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-15.5 w-11 shrink-0 items-center justify-center rounded border border-line bg-canvas text-ink-faint"
                  >
                    <Icon name="cards" size={18} />
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold text-ink">{book.title}</h2>
                  <p className="mt-0.5 text-sm text-ink-faint">
                    {book.total} {plural(book.total, 'карточка', 'карточки', 'карточек')}
                  </p>
                </div>

                {book.due > 0 ? (
                  <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-strong">
                    {book.due} к повторению
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                    всё повторено
                  </span>
                )}

                <Icon
                  name="arrow-right"
                  size={16}
                  className="shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Статистика — здесь же: она про карточки, а не про человека. */}
      {user ? <StudyStats userId={user.id} /> : null}
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

export default StudyIndex
