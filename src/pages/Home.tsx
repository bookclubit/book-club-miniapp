import useSWR from 'swr'
import BookCard from '../components/BookCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import MeetingCard from '../components/MeetingCard'
import { BOOK_IDS, fetchBooks, MEETINGS } from '../lib/api'
import type { BookMeta } from '../types'

// Главная: список книг клуба и блок ближайших встреч.
function Home() {
  const { data, error, isLoading } = useSWR<BookMeta[]>('books', fetchBooks)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Книги клуба</h1>
        <p className="mt-1 text-muted">Читаем и разбираем вместе по главам.</p>

        <div className="mt-5">
          {isLoading ? (
            <Loading label="Загружаем книги…" />
          ) : error ? (
            <ErrorState message={(error as Error).message} />
          ) : !data || data.length === 0 ? (
            <EmptyState icon="📚" title="Пока нет книг" hint="Скоро добавим первую." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.map((book, i) => (
                <BookCard key={book.id} bookId={BOOK_IDS[i]} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">Ближайшие встречи</h2>
        <p className="mt-1 text-muted">Онлайн-разборы прочитанных глав.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {MEETINGS.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
