import { Link } from 'react-router-dom'
import { plural } from '../lib/format'
import Icon from './Icon'
import type { ChapterWithSlug } from '../types'

interface ChapterCardProps {
  bookId: string
  chapter: ChapterWithSlug
}

// Строка главы в списке на странице книги: номер, название, описание.
function ChapterCard({ bookId, chapter }: ChapterCardProps) {
  return (
    <Link
      to={`/book/${bookId}/chapter/${chapter.slug}`}
      className="card card-hover group flex items-start gap-4"
    >
      <span
        aria-hidden="true"
        className="font-display pt-0.5 text-3xl font-semibold leading-none text-line-strong transition-colors duration-200 group-hover:text-accent"
      >
        {String(chapter.order).padStart(2, '0')}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-lg font-semibold text-ink">{chapter.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {chapter.description}
        </p>
        <p className="mt-2 text-xs font-medium text-ink-faint">
          {chapter.topics.length}{' '}
          {plural(chapter.topics.length, 'тема', 'темы', 'тем')}
        </p>
      </div>

      <Icon
        name="arrow-right"
        size={16}
        className="mt-1 shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
      />
    </Link>
  )
}

export default ChapterCard
