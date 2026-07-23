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
import { fetchFlashcards } from '../lib/api'
import { bookCardScope, cardsInScope } from '../lib/deck'
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
import type { Flashcard, ReviewGrade, StudyProgress } from '../types'

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

// Страница изучения: флип-карточки с интервальным повторением (SM-2).
// При активной сессии источник истины — серверный прогресс (общий с ботом),
// localStorage — кэш и фолбэк для гостей; оценки уходят и на сервер.
function Study() {
  const { bookId } = useParams<{ bookId: string }>()
  const { user, loading: authLoading } = useAuth()

  const { data, error, isLoading } = useSWR<Flashcard[]>(
    bookId ? `flashcards:${bookId}` : null,
    () => fetchFlashcards(bookId as string),
  )

  // Серверный прогресс — только при активной сессии (ключи «<book>:<cardId>»).
  const server = useSWR<ServerCardProgress[]>(
    user ? `server-progress:${user.id}` : null,
    fetchServerProgress,
  )

  const [progress, setProgress] = useState<StudyProgress>({})
  const [queue, setQueue] = useState<string[]>([])
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [ready, setReady] = useState(false)
  // Ненавязчивое сообщение о проблемах синхронизации с сервером.
  const [syncNote, setSyncNote] = useState<string | null>(null)

  // Изучаем только карточки, добавленные в колоду (вся книга или отдельные главы).
  const deckCards = bookId && data ? cardsInScope(data, bookCardScope(bookId)) : []

  // Инициализация сессии: грузим прогресс и собираем очередь карточек «на сегодня».
  // Вошедшим сначала дожидаемся серверного прогресса — он источник истины.
  useEffect(() => {
    if (!bookId || !data || ready || authLoading) return
    if (user && !server.data && !server.error) return // ждём сервер

    let saved: StudyProgress
    if (user && server.data) {
      saved = serverToStudyProgress(server.data, bookId)
      saveProgress(bookId, saved) // локальная копия — кэш
    } else {
      saved = loadProgress(bookId)
      if (user && server.error) {
        setSyncNote('Серверный прогресс недоступен — используем сохранённый на устройстве.')
      }
    }

    const scoped = cardsInScope(data, bookCardScope(bookId))
    setProgress(saved)
    setQueue(scoped.filter((card) => isDue(saved[card.id])).map((card) => card.id))
    setReady(true)
  }, [bookId, data, ready, authLoading, user, server.data, server.error])

  if (!bookId) return <ErrorState message="Не указана книга." />
  if (isLoading || (!ready && !error && data && data.length > 0)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <Loading label="Загружаем карточки…" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <ErrorState message={(error as Error).message} />
      </div>
    )
  }
  if (deckCards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <BackLink />
        <div className="mt-6">
          {!data || data.length === 0 ? (
            <EmptyState title="Карточек пока нет" hint="Они появятся после разбора глав." />
          ) : (
            <EmptyState
              title="Этих карточек нет в твоей колоде"
              hint="Добавь их на странице книги или главы — и они появятся здесь."
            />
          )}
        </div>
      </div>
    )
  }

  const currentId = queue[0]
  const currentCard = deckCards.find((card) => card.id === currentId)
  const total = reviewed + queue.length
  const percent = total === 0 ? 100 : Math.round((reviewed / total) * 100)

  function handleGrade(grade: ReviewGrade) {
    if (!bookId || !currentId) return
    const prev = progress[currentId] ?? defaultCardProgress()
    const next = reviewCard(prev, grade)
    const updated: StudyProgress = { ...progress, [currentId]: next }
    setProgress(updated)
    saveProgress(bookId, updated)

    // При активной сессии — оценка уходит и на сервер (единый прогресс с ботом).
    // Ошибка не блокирует занятие: локально прогресс уже сохранён.
    if (user) {
      const cardId = currentId
      sendCardReview(bookId, cardId, grade)
        .then((serverNext) => {
          setSyncNote(null)
          // Сервер — источник истины: применяем его расчёт SM-2 локально и в кэш SWR.
          setProgress((p) => {
            const merged = { ...p, [cardId]: serverToCardProgress(serverNext) }
            saveProgress(bookId, merged)
            return merged
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
    setQueue(grade === 'again' ? [...rest, currentId] : rest)
    setReviewed((n) => n + 1)
    setFlipped(false)
  }

  function handleReset() {
    if (!bookId || !data) return
    resetProgress(bookId)
    setProgress({})
    setQueue(deckCards.map((card) => card.id))
    setReviewed(0)
    setFlipped(false)
  }

  // Все карточки «на сегодня» пройдены.
  if (!currentCard) {
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
          <button type="button" onClick={handleReset} className="btn-ghost mt-6">
            <Icon name="refresh" size={15} />
            Сбросить прогресс
          </button>
        </div>
      </div>
    )
  }

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
        <FlashCard card={currentCard} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
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
