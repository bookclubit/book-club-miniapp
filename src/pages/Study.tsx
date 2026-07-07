import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import FlashCard from '../components/FlashCard'
import Loading from '../components/Loading'
import { fetchFlashcards, flashcardsUrl } from '../lib/api'
import {
  defaultCardProgress,
  isDue,
  loadProgress,
  resetProgress,
  reviewCard,
  saveProgress,
} from '../lib/storage'
import type { Flashcard, ReviewGrade, StudyProgress } from '../types'

const GRADES: { grade: ReviewGrade; label: string; className: string }[] = [
  { grade: 'again', label: '🔁 Повторить', className: 'bg-red-500 hover:bg-red-600' },
  { grade: 'hard', label: '😥 Трудно', className: 'bg-amber-500 hover:bg-amber-600' },
  { grade: 'good', label: '🙂 Хорошо', className: 'bg-primary hover:bg-primary-hover' },
  { grade: 'easy', label: '😎 Легко', className: 'bg-emerald-500 hover:bg-emerald-600' },
]

// Страница изучения: флип-карточки с интервальным повторением (SM-2).
function Study() {
  const { bookId } = useParams<{ bookId: string }>()

  const { data, error, isLoading } = useSWR<Flashcard[]>(
    bookId ? flashcardsUrl(bookId) : null,
    () => fetchFlashcards(bookId as string),
  )

  const [progress, setProgress] = useState<StudyProgress>({})
  const [queue, setQueue] = useState<string[]>([])
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [ready, setReady] = useState(false)

  // Инициализация сессии: грузим прогресс и собираем очередь карточек «на сегодня».
  useEffect(() => {
    if (!bookId || !data || ready) return
    const saved = loadProgress(bookId)
    setProgress(saved)
    setQueue(data.filter((card) => isDue(saved[card.id])).map((card) => card.id))
    setReady(true)
  }, [bookId, data, ready])

  if (!bookId) return <ErrorState message="Не указана книга." />
  if (isLoading || !ready) return <Loading label="Загружаем карточки…" />
  if (error) return <ErrorState message={(error as Error).message} />
  if (!data || data.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <BackLink bookId={bookId} />
        <EmptyState icon="🎴" title="Карточек пока нет" />
      </div>
    )
  }

  const currentId = queue[0]
  const currentCard = data.find((card) => card.id === currentId)
  const total = reviewed + queue.length
  const percent = total === 0 ? 100 : Math.round((reviewed / total) * 100)

  function handleGrade(grade: ReviewGrade) {
    if (!bookId || !currentId) return
    const prev = progress[currentId] ?? defaultCardProgress()
    const next = reviewCard(prev, grade)
    const updated: StudyProgress = { ...progress, [currentId]: next }
    setProgress(updated)
    saveProgress(bookId, updated)

    // «Повторить» — вернуть карточку в конец очереди этой сессии.
    const rest = queue.slice(1)
    setQueue(grade === 'again' ? [...rest, currentId] : rest)
    setReviewed((n) => n + 1)
    setFlipped(false)
  }

  function handleReset() {
    if (!bookId || !data) return
    resetProgress(bookId)
    setProgress({})
    setQueue(data.map((card) => card.id))
    setReviewed(0)
    setFlipped(false)
  }

  // Все карточки «на сегодня» пройдены.
  if (!currentCard) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <BackLink bookId={bookId} />
        <div className="mt-6 text-center">
          <div className="mb-3 text-5xl">🎉</div>
          <p className="text-xl font-bold text-slate-900">На сегодня всё!</p>
          <p className="mt-1 text-muted">
            Повторено карточек: {reviewed}. Возвращайся позже — интервалы уже назначены.
          </p>
          <button type="button" onClick={handleReset} className="btn-ghost mt-5">
            🔄 Сбросить прогресс
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <BackLink bookId={bookId} />

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-sm text-muted">
          <span>Осталось: {queue.length}</span>
          <span>Повторено: {reviewed}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-6">
        <FlashCard card={currentCard} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      </div>

      <div className="mt-5">
        {flipped ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GRADES.map(({ grade, label, className }) => (
              <button
                key={grade}
                type="button"
                onClick={() => handleGrade(grade)}
                className={`rounded-[12px] px-3 py-2.5 text-sm font-semibold text-white transition-colors ${className}`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="btn-primary w-full"
          >
            👀 Показать ответ
          </button>
        )}
      </div>
    </div>
  )
}

// Ссылка назад к книге.
function BackLink({ bookId }: { bookId: string }) {
  return (
    <Link to={`/book/${bookId}`} className="text-sm text-primary hover:underline">
      ← К главам книги
    </Link>
  )
}

export default Study
