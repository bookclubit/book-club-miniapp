import { Link } from 'react-router-dom'
import { mediaUrl, readingProgress } from '../lib/api'
import { plural } from '../lib/format'
import type { BookMeta } from '../types'

interface BookCardProps {
  folder: string // имя папки книги в book-club-data — из него строится маршрут
  book: BookMeta
}

const STATUS: Record<BookMeta['status'], { label: string; className: string }> = {
  reading: { label: 'Читаем сейчас', className: 'bg-accent-soft text-accent-strong' },
  planned: { label: 'В планах', className: 'bg-canvas text-ink-faint' },
  finished: { label: 'Прочитана', className: 'bg-success-soft text-success' },
}

// Карточка книги: обложка + мета. Вся карточка — ссылка на страницу книги.
function BookCard({ folder, book }: BookCardProps) {
  const status = STATUS[book.status]
  const cover = mediaUrl(book.cover)
  const percent = readingProgress(folder, book.total_chapters)

  return (
    // h-full — карточки в сетке одной высоты: заголовки книг занимают то одну
    // строку, то две, и без этого соседи в ряду разъезжаются.
    <Link
      to={`/book/${folder}`}
      className="card card-hover group flex h-full flex-col p-4 sm:p-5"
    >
      <div className="flex gap-5">
        {cover ? (
          <img
            src={cover}
            alt={`Обложка книги «${book.title}»`}
            width={104}
            height={148}
            loading="lazy"
            className="h-37 w-26 shrink-0 rounded-md object-cover shadow-[0_4px_14px_-4px_rgb(0_0_0/0.3)] transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-37 w-26 shrink-0 items-center justify-center rounded-md border border-line bg-canvas font-mono text-xs text-ink-faint"
          >
            нет обложки
          </div>
        )}

        <div className="flex min-w-0 flex-col py-0.5">
          {/* self-start — в колонке-флексе плашка иначе растянулась бы во всю ширину. */}
          <span
            className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>

          <h3 className="font-display mt-2.5 text-xl font-semibold leading-snug text-ink">
            {book.title}
          </h3>
          <p className="mt-0.5 text-sm text-ink-faint">
            {book.authors.map((a) => a.name).join(', ')}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
            {book.description}
          </p>
        </div>
      </div>

      {/* Прогресс — во всю ширину карточки и прижат к низу: у соседей в ряду
          он на одной линии, а короткая шкала в колонке текста терялась. */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between text-xs text-ink-faint">
          <span>
            {book.total_chapters} {plural(book.total_chapters, 'глава', 'главы', 'глав')}
          </span>
          <span className="font-semibold text-ink-soft">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Прогресс чтения"
          className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line"
        >
          <div
            className="progress-fill h-full rounded-full bg-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </Link>
  )
}

export default BookCard
