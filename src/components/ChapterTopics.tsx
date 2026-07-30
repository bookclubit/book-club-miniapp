import { plural } from '../lib/format'
import TopicRow from './TopicRow'
import type { ChapterWithSlug } from '../types'

/**
 * Глава на странице книги: заголовок «Глава N + название» и темы строками.
 * Отдельной страницы у главы нет — кроме тем показывать нечего, а из-за
 * перехода они терялись.
 *
 * Без рамок и карточек: главу держит заголовок с подчёркиванием и воздух
 * между главами, а темы разделены тонкими линиями.
 */
function ChapterTopics({ chapter, delay }: { chapter: ChapterWithSlug; delay: number }) {
  const count = chapter.topics.length

  return (
    <section
      id={chapter.slug}
      className="reveal scroll-mt-24"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      <header className="flex items-end justify-between gap-4 border-b border-line pb-3">
        <div className="min-w-0">
          <p className="eyebrow">Глава {chapter.order}</p>
          <h2 className="font-display mt-1 text-xl font-semibold leading-snug text-ink">
            {chapter.title}
          </h2>
        </div>
        {count > 0 ? (
          <span className="shrink-0 pb-0.5 text-xs text-ink-faint">
            {count} {plural(count, 'тема', 'темы', 'тем')}
          </span>
        ) : null}
      </header>

      {count === 0 ? (
        <p className="pt-4 text-sm text-ink-faint">Темы появятся после разбора главы</p>
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
