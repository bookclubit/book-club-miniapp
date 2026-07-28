import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import BookCard from '../components/BookCard'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import { fetchBooks, mediaUrl } from '../lib/api'
import type { BookWithFolder } from '../lib/api'
import { findAuthor } from '../lib/authors'
import { plural } from '../lib/format'

// Страница автора: все его книги в клубе. Автор — не отдельная сущность в
// данных, а тот, кто указан в meta.json книг: список считается из тех же мет,
// что уже загружены каталогом (ключ SWR 'books').
function Author() {
  const { authorId = '' } = useParams()
  const { data, error, isLoading } = useSWR<BookWithFolder[]>('books', fetchBooks)

  if (isLoading) {
    return (
      <Centered>
        <Loading label="Загружаем автора…" />
      </Centered>
    )
  }
  if (error) {
    return (
      <Centered>
        <ErrorState message={(error as Error).message} />
      </Centered>
    )
  }

  const author = findAuthor(data ?? [], authorId)
  if (!author) {
    return (
      <Centered>
        <EmptyState title="Автор не найден" hint="Возможно, ссылка устарела." />
        <Link to="/books" className="link-back group mt-6 text-sm">
          <Icon name="arrow-left" size={14} />
          Все книги
        </Link>
      </Centered>
    )
  }

  const avatar = mediaUrl(author.avatar)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/books" className="link-back group text-sm">
        <Icon name="arrow-left" size={14} />
        Все книги
      </Link>

      <header className="reveal mt-6 flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        {avatar ? (
          <img
            src={avatar}
            alt={`Фото ${author.name}`}
            width={112}
            height={112}
            className="h-28 w-28 shrink-0 rounded-full object-cover ring-2 ring-line"
          />
        ) : null}
        <div className="mt-4 min-w-0 sm:mt-0">
          <h1 className="font-display text-3xl font-semibold text-ink">{author.name}</h1>
          <p className="mt-2 text-ink-soft">
            {author.books.length} {plural(author.books.length, 'книга', 'книги', 'книг')} в клубе
          </p>
          {author.url ? (
            <a
              href={author.url}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost mt-4 px-4 py-2 text-xs"
            >
              <Icon name="external" size={14} />
              Сайт автора
            </a>
          ) : null}
        </div>
      </header>

      <section className="reveal mt-10" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
        <h2 className="font-display text-2xl font-semibold text-ink">Книги</h2>
        {/* auto-rows-fr — карточки одной высоты, как в каталоге. */}
        <div className="mt-5 grid auto-rows-fr gap-4 lg:grid-cols-2">
          {author.books.map(({ folder, meta }, i) => (
            <div
              key={folder}
              className="reveal"
              style={{ '--reveal-delay': `${110 + i * 90}ms` } as React.CSSProperties}
            >
              <BookCard folder={folder} book={meta} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">{children}</div>
}

export default Author
