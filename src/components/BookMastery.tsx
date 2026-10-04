import { Link } from 'react-router-dom'
import { mediaUrl } from '../lib/api'
import { plural } from '../lib/format'
import { MASTERY_PARTS } from '../lib/mastery'
import Icon from './Icon'
import type { BookStats } from '../types'

// Закрашенные части полосы; новые карточки — её фон.
const SEGMENTS = MASTERY_PARTS.filter((part) => part.key !== 'fresh')
const TRACK = MASTERY_PARTS.find((part) => part.key === 'fresh')?.className ?? ''

/**
 * Книга на вкладке «Карточки» — одна карточка на всё: доля выученного с полосой
 * «выучено / изучаю / новые», сколько карточек и сколько ждёт повторения.
 * Запускает повторение этой книги; книга не из колоды ведёт на свою страницу.
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
          width={44}
          height={62}
          loading="lazy"
          className="h-15.5 w-11 shrink-0 rounded object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-15.5 w-11 shrink-0 items-center justify-center rounded border border-line bg-canvas text-ink-faint"
        >
          <Icon name="book" size={18} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 font-display text-lg font-semibold leading-snug text-ink">
            {book.title}
          </h3>
          <span
            title="Выучено"
            className="shrink-0 font-display text-lg font-semibold text-ink"
          >
            {percent}%
          </span>
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

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <span className="text-xs text-ink-faint">
            {book.total} {plural(book.total, 'карточка', 'карточки', 'карточек')}
          </span>
          {!book.in_deck ? (
            <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-semibold text-ink-faint">
              не в колоде
            </span>
          ) : book.due > 0 ? (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent-strong">
              {book.due} к повторению
            </span>
          ) : (
            <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
              всё повторено
            </span>
          )}
        </div>
      </div>

      {/* На телефоне стрелки нет: её место нужнее строке с числом карточек. */}
      <Icon
        name="arrow-right"
        size={16}
        className="hidden shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent sm:block"
      />
    </Link>
  )
}

export default BookMastery
