import { Link } from 'react-router-dom'
import type { ChapterWithSlug } from '../types'

interface ChapterCardProps {
  bookId: string
  chapter: ChapterWithSlug
}

// Карточка главы для страницы книги.
function ChapterCard({ bookId, chapter }: ChapterCardProps) {
  return (
    <Link to={`/book/${bookId}/chapter/${chapter.slug}`} className="card card-hover">
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {chapter.order}
        </span>
        <h3 className="text-base font-bold text-slate-900">{chapter.title}</h3>
      </div>
      <p className="line-clamp-3 text-sm text-slate-600">{chapter.description}</p>
      <p className="mt-3 text-xs text-muted">
        📎 {chapter.subchapters.length} подглав · 🎯 {chapter.learning_outcome.slice(0, 60)}…
      </p>
    </Link>
  )
}

export default ChapterCard
