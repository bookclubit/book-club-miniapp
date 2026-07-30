import { plural } from '../lib/format'
import TopicRow from './TopicRow'
import type { ChapterWithSlug } from '../types'

/**
 * Глава на странице книги: горизонтальный заголовок (номер, название, число тем)
 * и темы строками под ним. Отдельной страницы у главы нет — кроме тем показывать
 * нечего, а из-за перехода они терялись.
 *
 * Глава — блок с рамкой: их на странице десяток, и без границ темы всех глав
 * читались одной простынёй. Тема при этом остаётся строкой, а не карточкой.
 */
function ChapterTopics({ chapter, delay }: { chapter: ChapterWithSlug; delay: number }) {
  const count = chapter.topics.length

  return (
    <section
      id={chapter.slug}
      className="card reveal scroll-mt-20 overflow-hidden p-0"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      <header className="flex items-center gap-3 border-b border-line bg-canvas px-4 py-2.5 sm:px-5">
        <span
          aria-hidden="true"
          className="font-display shrink-0 text-xl font-semibold leading-none text-line-strong"
        >
          {String(chapter.order).padStart(2, '0')}
        </span>
        <h3 className="font-display min-w-0 grow text-base font-semibold leading-snug text-ink">
          {chapter.title}
        </h3>
        {count > 0 ? (
          <span className="shrink-0 text-xs text-ink-faint">
            {count} {plural(count, 'тема', 'темы', 'тем')}
          </span>
        ) : null}
      </header>

      {count === 0 ? (
        <p className="px-4 py-4 text-sm text-ink-faint sm:px-5">
          Темы появятся после разбора главы
        </p>
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
