import { Link } from 'react-router-dom'
import type { BookMeta } from '../types'

interface BookCardProps {
  bookId: string
  book: BookMeta
}

const STATUS_LABEL: Record<BookMeta['status'], string> = {
  reading: '📖 Читаем сейчас',
  planned: '🗓️ В планах',
  finished: '✅ Прочитано',
}

// Карточка книги для списка на главной.
function BookCard({ bookId, book }: BookCardProps) {
  return (
    <Link to={`/book/${bookId}`} className="card card-hover">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-primary">{STATUS_LABEL[book.status]}</span>
        <span className="text-xs text-muted">{book.total_chapters} глав</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900">{book.title}</h3>
      {book.title_original ? (
        <p className="text-sm italic text-muted">{book.title_original}</p>
      ) : null}
      <p className="mt-1 text-sm text-muted">{book.authors.join(', ')}</p>
      <p className="mt-3 line-clamp-3 text-sm text-slate-600">{book.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {book.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            #{tag}
          </span>
        ))}
      </div>
    </Link>
  )
}

export default BookCard
