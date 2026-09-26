import { Link } from 'react-router-dom'
import { mediaUrl } from '../lib/api'
import { MASTERY_PARTS } from '../lib/mastery'
import Icon from './Icon'
import type { BookStats } from '../types'

// Закрашенные части полосы; новые карточки — её фон.
const SEGMENTS = MASTERY_PARTS.filter((part) => part.key !== 'fresh')
const TRACK = MASTERY_PARTS.find((part) => part.key === 'fresh')?.className ?? ''

/**
 * Как выучена книга: доля выученных карточек, полоса «выучено / изучаю /
 * новые» и сколько ждёт повторения. Ведёт к повторению, если книга в колоде,
 * иначе — на страницу книги.
 */
function BookMastery({ book, cover }: { book: BookStats; cover?: string }) {
  const percent = book.total === 0 ? 0 : Math.round((book.mature / book.total) * 100)
  const to = book.in_deck ? `/study/${book.folder}` : `/book/${book.folder}`

  return (
    <Link to={to} className="card card-hover group flex items-center gap-4">
      {cover ? (
        <img
          src={mediaUrl(cover)}
          alt=""
          width={36}
          height={52}
          loading="lazy"
          className="h-13 w-9 shrink-0 rounded object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-13 w-9 shrink-0 items-center justify-center rounded border border-line bg-canvas text-ink-faint"
        >
          <Icon name="book" size={16} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="truncate font-display font-semibold text-ink">{book.title}</h3>
          <span className="shrink-0 font-display text-lg font-semibold text-ink">{percent}%</span>
        </div>

        <div
          role="img"
          aria-label={`Выучено ${book.mature}, изучаю ${book.learning}, новых ${book.fresh} из ${book.total}`}
          className={`mt-2 flex h-1.5 overflow-hidden rounded-full ${TRACK}`}
        >
          {SEGMENTS.map(({ key, className }) =>
            book[key] > 0 ? (
              <span
                key={key}
                className={`progress-fill h-full ${className}`}
                style={{ width: `${(book[key] / book.total) * 100}%` }}
              />
            ) : null,
          )}
        </div>

        <p className="mt-1.5 text-xs text-ink-faint">
          выучено {book.mature} из {book.total}
          {book.due > 0 ? <span className="font-medium text-accent-strong"> · {book.due} к повторению</span> : null}
          {book.in_deck ? null : ' · не в колоде'}
        </p>
      </div>
    </Link>
  )
}

export default BookMastery
