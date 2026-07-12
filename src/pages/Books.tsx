import useSWR from 'swr'
import BookCard from '../components/BookCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { fetchBooks } from '../lib/api'
import type { BookWithFolder } from '../lib/api'

// Вкладка «Книги»: все книги клуба с прогрессом чтения.
function Books() {
  const { data, error, isLoading } = useSWR<BookWithFolder[]>('books', fetchBooks)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Книги</h1>
        <p className="mt-2 text-ink-soft">Что читаем, что прочитали и что в планах.</p>
      </header>

      <div className="mt-8">
        {isLoading ? (
          <Loading label="Загружаем книги…" />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Пока нет книг" hint="Скоро добавим первую." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.map(({ folder, meta }, i) => (
              <div
                key={folder}
                className="reveal"
                style={{ '--reveal-delay': `${80 + i * 90}ms` } as React.CSSProperties}
              >
                <BookCard folder={folder} book={meta} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Books
