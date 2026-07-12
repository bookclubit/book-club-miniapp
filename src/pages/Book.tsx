import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import ChapterCard from '../components/ChapterCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import {
  fetchChapters,
  fetchFlashcards,
  fetcher,
  mediaUrl,
  metaUrl,
  readingProgress,
} from '../lib/api'
import { plural } from '../lib/format'
import type { BookMeta, ChapterWithSlug, Flashcard } from '../types'

// Страница книги: обложка, авторы, описание, главы и переход к карточкам.
function Book() {
  const { bookId } = useParams<{ bookId: string }>()

  const meta = useSWR<BookMeta>(bookId ? metaUrl(bookId) : null, fetcher)
  const chapters = useSWR<ChapterWithSlug[]>(
    bookId ? `chapters:${bookId}` : null,
    () => fetchChapters(bookId as string),
  )
  const cards = useSWR<Flashcard[]>(
    bookId ? `flashcards:${bookId}` : null,
    () => fetchFlashcards(bookId as string),
  )

  if (!bookId) return <ErrorState message="Не указана книга." />

  const isLoading = meta.isLoading || chapters.isLoading
  const error = meta.error || chapters.error
  const cardCount = cards.data?.length ?? 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link to="/" className="link-back">
        <Icon name="arrow-left" size={15} />
        Ко всем книгам
      </Link>

      {isLoading ? (
        <Loading label="Загружаем книгу…" />
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={(error as Error).message} />
        </div>
      ) : (
        <>
          {meta.data ? (
            <header className="reveal mt-8 flex flex-col gap-8 sm:flex-row">
              {meta.data.cover ? (
                <img
                  src={mediaUrl(meta.data.cover)}
                  alt={`Обложка книги «${meta.data.title}»`}
                  width={176}
                  height={250}
                  className="h-62.5 w-44 shrink-0 self-start rounded-lg object-cover shadow-lift"
                />
              ) : null}

              <div className="min-w-0">
                <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                  {meta.data.title}
                </h1>
                {meta.data.title_original ? (
                  <p className="font-display mt-1 text-base italic text-ink-faint">
                    {meta.data.title_original}
                    {meta.data.edition ? ` · ${meta.data.edition}-е издание` : ''}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {meta.data.authors.map((author) => (
                    <span key={author.name} className="flex items-center gap-2">
                      {author.avatar ? (
                        <img
                          src={mediaUrl(author.avatar)}
                          alt=""
                          width={28}
                          height={28}
                          loading="lazy"
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : null}
                      <span className="text-sm font-medium text-ink-soft">{author.name}</span>
                    </span>
                  ))}
                </div>

                <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
                  {meta.data.description}
                </p>

                <div className="mt-5 max-w-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-faint">
                      Разобрано {chapters.data?.length ?? 0} из {meta.data.total_chapters}{' '}
                      {plural(meta.data.total_chapters, 'главы', 'глав', 'глав')}
                    </span>
                    <span className="font-semibold text-ink">
                      {readingProgress(bookId, meta.data.total_chapters)}%
                    </span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={readingProgress(bookId, meta.data.total_chapters)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Прогресс чтения"
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
                  >
                    <div
                      className="progress-fill h-full rounded-full bg-accent"
                      style={{ width: `${readingProgress(bookId, meta.data.total_chapters)}%` }}
                    />
                  </div>
                </div>

                {cardCount > 0 ? (
                  <Link to={`/study/${bookId}`} className="btn-primary mt-5">
                    <Icon name="cards" size={16} />
                    Учить карточки
                    <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs">
                      {cardCount}
                    </span>
                  </Link>
                ) : null}
              </div>
            </header>
          ) : null}

          <section
            className="reveal mt-12"
            style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
          >
            <h2 className="font-display text-2xl font-semibold text-ink">Разобранные главы</h2>
            <div className="mt-5">
              {!chapters.data || chapters.data.length === 0 ? (
                <EmptyState
                  title="Главы пока не добавлены"
                  hint="Материалы появятся по мере разбора книги."
                />
              ) : (
                <div className="space-y-3">
                  {chapters.data.map((chapter, i) => (
                    <div
                      key={chapter.slug}
                      className="reveal"
                      style={{ '--reveal-delay': `${170 + i * 80}ms` } as React.CSSProperties}
                    >
                      <ChapterCard bookId={bookId} chapter={chapter} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Book
