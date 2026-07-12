import { Link } from 'react-router-dom'
import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import { BOOK_IDS, fetchBooks, fetchFlashcards, mediaUrl } from '../lib/api'
import type { BookWithFolder } from '../lib/api'
import { plural } from '../lib/format'
import { isDue, loadProgress } from '../lib/storage'
import type { Flashcard } from '../types'

interface StudyBook {
  folder: string
  title: string
  cover?: string
  total: number
  due: number
}

// Собирает книги, у которых есть карточки, с числом карточек «к повторению сегодня».
async function fetchStudyBooks(): Promise<StudyBook[]> {
  const books = await fetchBooks()
  const withCards = await Promise.all(
    books.map(async ({ folder, meta }: BookWithFolder): Promise<StudyBook | null> => {
      const cards: Flashcard[] = await fetchFlashcards(folder)
      if (cards.length === 0) return null
      const progress = loadProgress(folder)
      return {
        folder,
        title: meta.title,
        cover: meta.cover,
        total: cards.length,
        due: cards.filter((card) => isDue(progress[card.id])).length,
      }
    }),
  )
  return withCards.filter((book): book is StudyBook => book !== null)
}

// Вкладка «Карточки»: выбор книги для интервального повторения.
function StudyIndex() {
  const { data, error, isLoading } = useSWR<StudyBook[]>(
    `study-books:${BOOK_IDS.join(',')}`,
    fetchStudyBooks,
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Карточки</h1>
        <p className="mt-2 text-ink-soft">
          Интервальное повторение по алгоритму SM-2: отвечай и отмечай, насколько легко
          вспомнил.
        </p>
      </header>

      <div className="mt-8">
        {isLoading ? (
          <Loading label="Загружаем карточки…" />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Карточек пока нет"
            hint="Они появятся после разбора первых глав."
          />
        ) : (
          <div className="space-y-3">
            {data.map((book, i) => (
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
    </div>
  )
}

export default StudyIndex
