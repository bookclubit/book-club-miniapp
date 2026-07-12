import { Link } from 'react-router-dom'
import useSWR from 'swr'
import BookCard from '../components/BookCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import EventCard from '../components/EventCard'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import { fetchBooks, fetchEvents } from '../lib/api'
import type { BookWithFolder } from '../lib/api'
import type { ClubEvent } from '../types'

// Главная: интро, текущая книга («Сейчас читаем») и встречи из book-club-data.
function Home() {
  const books = useSWR<BookWithFolder[]>('books', fetchBooks)
  const events = useSWR<ClubEvent[]>('events', fetchEvents)

  const reading = books.data?.filter(({ meta }) => meta.status === 'reading') ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="reveal max-w-2xl">
        <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          Читаем техническую литературу вместе
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          По главе в неделю: разбираем на встречах, делимся инсайтами
          и закрепляем материал карточками.
        </p>
      </section>

      <section className="reveal mt-14" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Сейчас читаем</h2>
          <Link
            to="/books"
            className="link-back group text-sm"
          >
            Все книги
            <Icon
              name="arrow-right"
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <div className="mt-5">
          {books.isLoading ? (
            <Loading label="Загружаем книги…" />
          ) : books.error ? (
            <ErrorState message={(books.error as Error).message} />
          ) : reading.length === 0 ? (
            <EmptyState title="Сейчас ничего не читаем" hint="Следующая книга — скоро." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {reading.map(({ folder, meta }, i) => (
                <div
                  key={folder}
                  className="reveal"
                  style={{ '--reveal-delay': `${150 + i * 90}ms` } as React.CSSProperties}
                >
                  <BookCard folder={folder} book={meta} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="reveal mt-14" style={{ '--reveal-delay': '220ms' } as React.CSSProperties}>
        <h2 className="font-display text-2xl font-semibold text-ink">Встречи</h2>
        <p className="mt-1 text-ink-soft">Закрытые разборы глав и открытые эфиры с докладами.</p>

        <div className="mt-5">
          {events.isLoading ? (
            <Loading label="Загружаем встречи…" />
          ) : events.error ? (
            <ErrorState message={(events.error as Error).message} />
          ) : !events.data || events.data.length === 0 ? (
            <EmptyState title="Встреч пока нет" hint="Расписание появится здесь." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {events.data.map((event, i) => (
                <div
                  key={event.id}
                  className="reveal"
                  style={{ '--reveal-delay': `${250 + i * 90}ms` } as React.CSSProperties}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
