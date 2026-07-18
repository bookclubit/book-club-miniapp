import { Link } from 'react-router-dom'
import useSWR from 'swr'
import BookCard from '../components/BookCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import EventCard from '../components/EventCard'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import SocialLinks from '../components/SocialLinks'
import { fetchBooks, fetchEvents, speakerUrl } from '../lib/api'
import type { BookWithFolder } from '../lib/api'
import type { ClubEvent } from '../types'

// Главная: интро с соцсетями, ближайшие встречи и текущая книга из book-club-data.
function Home() {
  const books = useSWR<BookWithFolder[]>('books', fetchBooks)
  const events = useSWR<ClubEvent[]>('events', fetchEvents)

  const reading = books.data?.filter(({ meta }) => meta.status === 'reading') ?? []

  // Ближайшие встречи: только будущие (events уже отсортированы по дате), максимум две.
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = (events.data ?? []).filter((e) => e.date >= today).slice(0, 2)

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
        <SocialLinks />
      </section>

      <section className="reveal mt-14" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Ближайшие встречи</h2>
          <Link to="/meetings" className="link-back group text-sm">
            Все встречи
            <Icon
              name="arrow-right"
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <div className="mt-5">
          {events.isLoading ? (
            <Loading label="Загружаем встречи…" />
          ) : events.error ? (
            <ErrorState message={(events.error as Error).message} />
          ) : upcoming.length === 0 ? (
            <EmptyState title="Встреч пока нет" hint="Расписание появится здесь." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcoming.map((event, i) => (
                <div
                  key={event.id}
                  className="reveal"
                  style={{ '--reveal-delay': `${150 + i * 90}ms` } as React.CSSProperties}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="reveal mt-14" style={{ '--reveal-delay': '200ms' } as React.CSSProperties}>
        <div className="card flex flex-col items-start gap-5 border-transparent bg-accent-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-accent">
              <Icon name="mic" size={20} />
              <h2 className="font-display text-2xl font-semibold text-ink">Стать спикером</h2>
            </div>
            <p className="mt-2 text-ink-soft">
              Возьми тему из плана главы, разбери её на встрече — а презентацию клуб
              соберёт за тебя из шаблона. Заявку одобрит админ.
            </p>
          </div>
          <a
            href={speakerUrl()}
            target="_blank"
            rel="noreferrer"
            className="btn-primary shrink-0 px-5 py-2.5 text-sm"
          >
            <Icon name="mic" size={16} />
            Хочу выступить
          </a>
        </div>
      </section>

      <section className="reveal mt-14" style={{ '--reveal-delay': '280ms' } as React.CSSProperties}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Сейчас читаем</h2>
          <Link to="/books" className="link-back group text-sm">
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
                  style={{ '--reveal-delay': `${250 + i * 90}ms` } as React.CSSProperties}
                >
                  <BookCard folder={folder} book={meta} />
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
