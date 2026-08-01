import { formatDateWithYear, plural } from '../lib/format'
import type { ChapterBroadcast, TopicMaterials } from '../lib/materials'
import Icon from './Icon'
import MaterialLinks, { MaterialGlyph } from './MaterialLinks'
import TopicRow from './TopicRow'
import type { ChapterWithSlug } from '../types'

const PLATFORMS = [
  { kind: 'youtube' as const, title: 'на YouTube' },
  { kind: 'vk' as const, title: 'в VK' },
]

/**
 * Записи трансляций главы. Одна встреча — две привычные иконки. Но встреч по
 * главе бывает и три (главу делят на части, обсуждение и доклады — разные
 * вечера), и шесть одинаковых логотипов подряд превращают заголовок в кашу.
 * Поэтому части группируются по площадке: логотип — метка, номера частей рядом
 * с ним — ссылки. Дата каждой части остаётся в подсказке.
 */
function ChapterBroadcasts({ items }: { items: ChapterBroadcast[] }) {
  if (items.length === 0) return null

  if (items.length === 1) {
    const [only] = items
    const when = formatDateWithYear(only.date)
    return (
      <MaterialLinks
        items={PLATFORMS.flatMap(({ kind, title }) =>
          only[kind] ? [{ kind, href: only[kind] as string, label: `Трансляция ${when} ${title}` }] : [],
        )}
      />
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-3">
      {PLATFORMS.map(({ kind, title }) => {
        const parts = items
          .map((item, i) => ({ href: item[kind], part: i + 1, when: formatDateWithYear(item.date) }))
          .filter((p): p is { href: string; part: number; when: string } => Boolean(p.href))
        if (parts.length === 0) return null
        return (
          <span key={kind} className="flex items-center gap-0.5 text-ink-faint">
            <MaterialGlyph kind={kind} />
            {parts.map((p) => (
              <a
                key={p.part}
                href={p.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`Трансляция ${title}, часть ${p.part} — ${p.when}`}
                title={`Часть ${p.part} — ${p.when}`}
                className="icon-link w-6 text-xs tabular-nums"
              >
                {p.part}
              </a>
            ))}
          </span>
        )
      })}
    </div>
  )
}

/**
 * Глава на странице книги: заголовок «Глава N + название» и темы строками.
 * Отдельной страницы у главы нет — кроме тем показывать нечего, а из-за
 * перехода они терялись.
 *
 * Без рамок и карточек: главу держит заголовок с подчёркиванием и воздух
 * между главами, а темы разделены тонкими линиями.
 *
 * Главы раскрыты по умолчанию (страница книги — про содержание, а не про
 * оглавление), но их можно свернуть: у книги бывает больше десятка глав.
 */
function ChapterTopics({
  chapter,
  delay,
  board,
  broadcasts = [],
  materials,
  open = true,
  onToggle,
}: {
  chapter: ChapterWithSlug
  delay: number
  /** Доска обсуждения главы (Excalidraw, Miro или скриншот) — из встречи. */
  board?: string
  /** Записи трансляций встреч по этой главе. */
  broadcasts?: ChapterBroadcast[]
  /** Спикеры и ссылки по темам: часть из них живёт не в главе, а в заявках
      и встречах (`lib/materials.ts`). */
  materials?: Record<string, TopicMaterials>
  open?: boolean
  onToggle?: () => void
}) {
  const count = chapter.topics.length
  const boardLabel = `Доска обсуждения главы ${chapter.order}`
  const listId = `${chapter.slug}-topics`

  return (
    <section
      id={chapter.slug}
      className="reveal scroll-mt-24"
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      <header className="flex items-end justify-between gap-4 border-b border-line pb-3">
        {/* Заголовок — кнопка: по нему главу сворачивают и раскрывают.
            Ссылки на материалы держим снаружи кнопки (вложенные интерактивные
            элементы ломают клавиатуру и скринридер). */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={listId}
          className="group -my-1 flex min-w-0 items-start gap-2 py-1 text-left"
        >
          <Icon
            name="chevron"
            size={16}
            className={`mt-5 shrink-0 text-ink-faint transition-transform duration-200 group-hover:text-accent ${
              open ? '' : '-rotate-90'
            }`}
          />
          <span className="min-w-0">
            <span className="eyebrow block">Глава {chapter.order}</span>
            <span className="font-display mt-1 block text-xl font-semibold leading-snug text-ink transition-colors duration-200 group-hover:text-accent">
              {chapter.title}
            </span>
          </span>
        </button>

        {/* Материалы всей главы: доска обсуждения и записи трансляций.
            Доска — у главы, а не у темы: на обсуждении её рисуют на всю главу. */}
        <div className="flex shrink-0 items-center gap-2 pb-0.5">
          {count > 0 ? (
            <span className="text-xs text-ink-faint">
              {count} {plural(count, 'тема', 'темы', 'тем')}
            </span>
          ) : null}
          {board ? (
            <a
              href={board}
              target="_blank"
              rel="noreferrer"
              aria-label={boardLabel}
              title={boardLabel}
              className="icon-link -my-1"
            >
              <Icon name="board" size={19} />
            </a>
          ) : null}
          <ChapterBroadcasts items={broadcasts} />
        </div>
      </header>

      {!open ? null : count === 0 ? (
        <p className="pt-4 text-sm text-ink-faint">Темы появятся после разбора главы</p>
      ) : (
        <ul id={listId} className="divide-y divide-line">
          {chapter.topics.map((topic, i) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              index={i}
              materials={materials?.[topic.id]}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default ChapterTopics
