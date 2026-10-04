import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import FlashCard from '../components/FlashCard'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import {
  fetchServerProgress,
  sendCardReview,
  serverToCardProgress,
  serverToStudyProgress,
  type ServerCardProgress,
} from '../lib/account'
import { fetchFlashcardsOf, fetchIndex } from '../lib/api'
import { bookCardScope, cardsInScope, deckFolders } from '../lib/deck'
import { plural } from '../lib/format'
import {
  defaultCardProgress,
  isDue,
  loadProgress,
  resetProgress,
  reviewCard,
  saveProgress,
} from '../lib/storage'
import { useAuth } from '../lib/useAuth'
import { useDeck } from '../lib/useDeck'
import type { ContentIndex, Deck, Flashcard, ReviewGrade, StudyProgress } from '../types'

// Кнопки оценки: семантические цвета, текст ≥ 4.5:1 на мягком фоне.
const GRADES: { grade: ReviewGrade; label: string; className: string }[] = [
  {
    grade: 'again',
    label: 'Снова',
    className: 'border-danger/30 bg-danger-soft text-danger hover:border-danger/60',
  },
  {
    grade: 'hard',
    label: 'Трудно',
    className: 'border-warn/30 bg-warn-soft text-warn hover:border-warn/60',
  },
  {
    grade: 'good',
    label: 'Хорошо',
    className: 'border-accent/30 bg-accent-soft text-accent-strong hover:border-accent/60',
  },
  {
    grade: 'easy',
    label: 'Легко',
    className: 'border-success/30 bg-success-soft text-success hover:border-success/60',
  },
]

// Карточка сессии. В общей сессии карточки разных книг, поэтому ключ —
// «<книга>:<id карточки>», как у прогресса на сервере.
interface SessionCard {
  key: string
  book: string
  card: Flashcard
}

// Изучаем только карточки, добавленные в колоду (вся книга или отдельные главы).
function sessionCards(
  folders: string[],
  cards: Record<string, Flashcard[]>,
  deck: Deck,
): SessionCard[] {
  return folders.flatMap((book) =>
    cardsInScope(cards[book] ?? [], bookCardScope(book, deck)).map((card) => ({
      key: `${book}:${card.id}`,
      book,
      card,
    })),
  )
}

// Тасование Фишера — Йетса: в общей сессии книги идут вперемешку.
function shuffle<T>(list: T[]): T[] {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Страница изучения: флип-карточки с интервальным повторением (SM-2).
// `/study/:bookId` — карточки одной книги по порядку, `/study/all` — общая
// сессия: карточки к повторению из всех книг колоды вперемешку (сюда же ведёт
// кнопка «Повторить карточки» в напоминании бота).
// При активной сессии источник истины — серверный прогресс (общий с ботом),
// localStorage — кэш и фолбэк для гостей; оценки уходят и на сервер.
function Study() {
  const { bookId } = useParams<{ bookId: string }>()
  const { user, loading: authLoading } = useAuth()
  const { deck, ready: deckReady } = useDeck()

  // Без книги в маршруте — общая сессия по всем книгам колоды.
  const folders = bookId ? [bookId] : deckFolders(deck)
  const cards = useSWR(
    (bookId || deckReady) && folders.length > 0 ? `study-cards:${folders.join(',')}` : null,
    () => fetchFlashcardsOf(folders),
  )

  // Серверный прогресс — только при активной сессии (ключи «<book>:<cardId>»).
  const server = useSWR<ServerCardProgress[]>(
    user ? `server-progress:${user.id}` : null,
    fetchServerProgress,
  )
  // В общей сессии над карточкой подписана её книга — название берём из реестра.
  const index = useSWR<ContentIndex>(bookId ? null : 'index', fetchIndex)

  // Прогресс по книгам: хранится и синхронизируется он покнижно.
  const [progress, setProgress] = useState<Record<string, StudyProgress>>({})
  const [queue, setQueue] = useState<string[]>([])
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [ready, setReady] = useState(false)
  // Ненавязчивое сообщение о проблемах синхронизации с сервером.
  const [syncNote, setSyncNote] = useState<string | null>(null)

  const session = cards.data ? sessionCards(folders, cards.data, deck) : []

  // Инициализация сессии: грузим прогресс и собираем очередь карточек «на сегодня».
  // Вошедшим сначала дожидаемся серверного прогресса и колоды — они источник истины.
  useEffect(() => {
    if (!cards.data || ready || authLoading || !deckReady) return
    if (user && !server.data && !server.error) return // ждём сервер

    const books = bookId ? [bookId] : deckFolders(deck)
    const saved: Record<string, StudyProgress> = {}
    for (const book of books) {
      if (user && server.data) {
        saved[book] = serverToStudyProgress(server.data, book)
        saveProgress(book, saved[book]) // локальная копия — кэш
      } else {
        saved[book] = loadProgress(book)
      }
    }
    if (user && !server.data) {
      setSyncNote('Серверный прогресс недоступен — используем сохранённый на устройстве.')
    }

    const due = sessionCards(books, cards.data, deck)
      .filter((item) => isDue(saved[item.book]?.[item.card.id]))
      .map((item) => item.key)
    setProgress(saved)
    setQueue(bookId ? due : shuffle(due))
    setReady(true)
  }, [bookId, cards.data, ready, authLoading, deckReady, deck, user, server.data, server.error])

  if (cards.error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <ErrorState message={(cards.error as Error).message} />
      </div>
    )
  }
  if (authLoading || !deckReady || cards.isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Loading label="Загружаем карточки…" />
      </div>
    )
  }
  if (session.length === 0) {
    const noCards = folders.every((book) => (cards.data?.[book] ?? []).length === 0)
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <BackLink />
        <div className="mt-6">
          {!bookId ? (
            <EmptyState
              title={folders.length === 0 ? 'Колода пуста' : 'В колоде пока нет карточек'}
              hint={
                folders.length === 0
                  ? 'Открой книгу и нажми «В колоду» — её карточки появятся здесь.'
                  : 'Карточки появятся после разбора глав.'
              }
              action={
                <Link to="/books" className="btn-ghost">
                  <Icon name="book" size={16} />
                  К книгам
                </Link>
              }
            />
          ) : noCards ? (
            <EmptyState title="Карточек пока нет" hint="Они появятся после разбора глав." />
          ) : (
            <EmptyState
              title="Этих карточек нет в твоей колоде"
              hint="Нажми «В колоду» на странице книги — и они появятся здесь."
              action={
                <Link to={`/book/${bookId}`} className="btn-ghost">
                  <Icon name="book" size={16} />
                  К книге
                </Link>
              }
            />
          )}
        </div>
      </div>
    )
  }
  // Карточки уже есть, очередь ещё собирается (ждём серверный прогресс).
  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Loading label="Загружаем карточки…" />
      </div>
    )
  }

  const current = session.find((item) => item.key === queue[0])
  const total = reviewed + queue.length
  const percent = total === 0 ? 100 : Math.round((reviewed / total) * 100)

  function handleGrade(grade: ReviewGrade) {
    if (!current) return
    const { key, book, card } = current
    const prev = progress[book]?.[card.id] ?? defaultCardProgress()
    const updated: StudyProgress = { ...progress[book], [card.id]: reviewCard(prev, grade) }
    setProgress({ ...progress, [book]: updated })
    saveProgress(book, updated)

    // При активной сессии — оценка уходит и на сервер (единый прогресс с ботом).
    // Ошибка не блокирует занятие: локально прогресс уже сохранён.
    if (user) {
      sendCardReview(book, card.id, grade)
        .then((serverNext) => {
          setSyncNote(null)
          // Сервер — источник истины: применяем его расчёт SM-2 локально и в кэш SWR.
          setProgress((p) => {
            const merged = { ...p[book], [card.id]: serverToCardProgress(serverNext) }
            saveProgress(book, merged)
            return { ...p, [book]: merged }
          })
          void server.mutate(
            (list) =>
              list
                ? [...list.filter((item) => item.cardId !== serverNext.cardId), serverNext]
                : list,
            { revalidate: false },
          )
        })
        .catch(() => {
          setSyncNote('Не удалось сохранить оценку на сервере — прогресс сохранён на устройстве.')
        })
    }

    // «Снова» — вернуть карточку в конец очереди этой сессии.
    const rest = queue.slice(1)
    setQueue(grade === 'again' ? [...rest, key] : rest)
    setReviewed((n) => n + 1)
    setFlipped(false)
  }

  function handleReset() {
    if (!bookId) return
    resetProgress(bookId)
    setProgress({})
    setQueue(session.map((item) => item.key))
    setReviewed(0)
    setFlipped(false)
  }

  // Все карточки «на сегодня» пройдены.
  if (!current) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <BackLink />
        <div className="reveal mt-14 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
            <Icon name="check" size={26} />
          </span>
          <p className="font-display mt-5 text-2xl font-semibold text-ink">На сегодня всё</p>
          <p className="mx-auto mt-2 max-w-sm text-ink-soft">
            {reviewed > 0
              ? `Повторено ${reviewed} ${plural(reviewed, 'карточка', 'карточки', 'карточек')}. Интервалы назначены — возвращайся позже.`
              : 'Все карточки ждут своего срока. Возвращайся позже.'}
          </p>
          <SyncNote note={syncNote} />
          {/* Сброс — только у одной книги: стереть прогресс всей колоды разом
              одной кнопкой было бы слишком легко. */}
          {bookId ? (
            <button type="button" onClick={handleReset} className="btn-ghost mt-6">
              <Icon name="refresh" size={15} />
              Сбросить прогресс
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  const bookTitle = bookId
    ? undefined
    : index.data?.books.find((b) => b.folder === current.book)?.title

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <BackLink />

      <div className="reveal mt-6">
        <div className="mb-2 flex items-center justify-between text-sm text-ink-faint">
          <span>Осталось: {queue.length}</span>
          <span>Повторено: {reviewed}</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Прогресс сессии"
          className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        >
          <div
            className="progress-fill h-full rounded-full bg-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="reveal mt-8" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
        {bookTitle ? (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-ink-faint">
            <Icon name="book" size={13} />
            {bookTitle}
          </p>
        ) : null}
        <FlashCard card={current.card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      </div>

      <div className="mt-6">
        {flipped ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {GRADES.map(({ grade, label, className }) => (
              <button
                key={grade}
                type="button"
                onClick={() => handleGrade(grade)}
                className={`rounded-btn border px-3 py-2.5 text-sm font-semibold transition-[border-color,transform] duration-200 active:scale-[0.98] ${className}`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" onClick={() => setFlipped(true)} className="btn-primary w-full">
            Показать ответ
          </button>
        )}
        <SyncNote note={syncNote} />
      </div>
    </div>
  )
}

// Ненавязчивое сообщение о состоянии синхронизации с сервером.
function SyncNote({ note }: { note: string | null }) {
  if (!note) return null
  return (
    <p role="status" className="mt-3 text-center text-xs text-ink-faint">
      {note}
    </p>
  )
}

// Ссылка назад к выбору книги для повторения.
function BackLink() {
  return (
    <Link to="/study" className="link-back">
      <Icon name="arrow-left" size={15} />
      Ко всем карточкам
    </Link>
  )
}

export default Study
