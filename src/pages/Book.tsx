import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import ChapterCard from '../components/ChapterCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { fetchChapters, fetcher, metaUrl } from '../lib/api'
import type { BookMeta, ChapterWithSlug } from '../types'

// Страница книги: описание и карточки глав.
function Book() {
  const { bookId } = useParams<{ bookId: string }>()

  const meta = useSWR<BookMeta>(bookId ? metaUrl(bookId) : null, fetcher)
  const chapters = useSWR<ChapterWithSlug[]>(
    bookId ? `chapters:${bookId}` : null,
    () => fetchChapters(bookId as string),
  )

  if (!bookId) return <ErrorState message="Не указана книга." />

  const isLoading = meta.isLoading || chapters.isLoading
  const error = meta.error || chapters.error

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/" className="text-sm text-primary hover:underline">
        ← Ко всем книгам
      </Link>

      {isLoading ? (
        <Loading label="Загружаем книгу…" />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : (
        <>
          {meta.data ? (
            <header className="mt-4">
              <h1 className="text-2xl font-bold text-slate-900">{meta.data.title}</h1>
              <p className="mt-1 text-muted">{meta.data.authors.join(', ')}</p>
              <p className="mt-3 max-w-2xl text-slate-600">{meta.data.description}</p>
              <Link to={`/study/${bookId}`} className="btn-primary mt-5">
                🎴 Учить карточки
              </Link>
            </header>
          ) : null}

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Главы</h2>
            <div className="mt-4">
              {!chapters.data || chapters.data.length === 0 ? (
                <EmptyState
                  icon="📖"
                  title="Главы пока не добавлены"
                  hint="Материалы появятся по мере разбора книги."
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {chapters.data.map((chapter) => (
                    <ChapterCard key={chapter.slug} bookId={bookId} chapter={chapter} />
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
