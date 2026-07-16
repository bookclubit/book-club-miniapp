import { useState } from 'react'
import useSWR from 'swr'
import BookCard from '../components/BookCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { fetchBooks } from '../lib/api'
import type { BookWithFolder } from '../lib/api'
import { BOOK_CATEGORIES } from '../types'
import type { BookCategory } from '../types'

// Вкладка «Книги»: все книги клуба с прогрессом чтения и фильтром по категориям.
function Books() {
  const { data, error, isLoading } = useSWR<BookWithFolder[]>('books', fetchBooks)
  const [filter, setFilter] = useState<'all' | BookCategory>('all')

  const books = data ?? []
  const visible = filter === 'all' ? books : books.filter((b) => b.meta.category === filter)
  const countBy = (cat: BookCategory) => books.filter((b) => b.meta.category === cat).length

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Книги</h1>
        <p className="mt-2 text-ink-soft">Что читаем, что прочитали и что в планах.</p>
      </header>

      {books.length > 0 && (
        <div className="reveal mt-6 flex flex-wrap gap-2" style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
          <FilterTab active={filter === 'all'} onClick={() => setFilter('all')}>
            Все книги
          </FilterTab>
          {BOOK_CATEGORIES.filter((c) => countBy(c.id) > 0).map((c) => (
            <FilterTab key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
            </FilterTab>
          ))}
        </div>
      )}

      <div className="mt-8">
        {isLoading ? (
          <Loading label="Загружаем книги…" />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : books.length === 0 ? (
          <EmptyState title="Пока нет книг" hint="Скоро добавим первую." />
        ) : visible.length === 0 ? (
          <EmptyState title="В этой категории пока пусто" hint="Загляните в другие вкладки." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map(({ folder, meta }, i) => (
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

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-on-accent'
          : 'rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-faint transition-colors duration-200 hover:text-ink'
      }
    >
      {children}
    </button>
  )
}

export default Books
