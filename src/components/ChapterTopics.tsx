import TopicRow from './TopicRow'
import type { ChapterWithSlug } from '../types'

/**
 * Глава на странице книги: подпись вертикально у левого края, темы — списком.
 * Отдельной страницы у главы нет: кроме тем показывать нечего, а из-за перехода
 * они терялись. Поэтому главное здесь темы, глава — только подпись-разделитель.
 *
 * Подпись позиционируется абсолютно: так высоту блока задаёт список тем,
 * а не длина названия главы (она обрезается по высоте списка).
 */
function ChapterTopics({ chapter, delay }: { chapter: ChapterWithSlug; delay: number }) {
  const label = `Глава ${chapter.order} · ${chapter.title}`

  return (
    <section
      id={chapter.slug}
      aria-label={label}
      className="reveal relative scroll-mt-20 pl-9"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      <div className="absolute inset-y-0 left-0 flex w-7 items-center justify-center overflow-hidden border-r border-line">
        <span
          title={label}
          className="chapter-label block truncate text-xs font-medium text-ink-faint"
        >
          <span className="font-semibold text-ink-soft">Глава {chapter.order}</span>{' '}
          · {chapter.title}
        </span>
      </div>

      {chapter.topics.length === 0 ? (
        <p className="py-4 text-sm text-ink-faint">Темы появятся после разбора главы</p>
      ) : (
        <ul className="divide-y divide-line">
          {chapter.topics.map((topic, i) => (
            <TopicRow key={topic.id} topic={topic} index={i} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default ChapterTopics
