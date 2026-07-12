import { speakerAvatar } from '../lib/api'
import { parseBlocks, parseInline } from '../lib/markdown'
import type { Block } from '../lib/markdown'
import Icon from './Icon'
import { BlockView, InlineText } from './Markdown'
import type { Topic } from '../types'

interface TopicSectionProps {
  topic: Topic
  index: number
}

// Секция «Мнение спикера»: параграфы вида «**Имя:** текст».
const OPINION_HEADING = /^мнени[ея] спикер(а|ов)$/i
const OPINION_RE = /^\*\*(.+?):?\*\*:?\s*(.*)$/s

function SpeakerOpinion({ text }: { text: string }) {
  const match = text.match(OPINION_RE)
  const name = match ? match[1].trim() : ''
  const opinion = match ? match[2].trim() : text
  const avatar = name ? speakerAvatar(name) : undefined

  return (
    <figure className="my-3 rounded-card bg-canvas p-4">
      <blockquote className="text-[15px] leading-relaxed text-ink-soft">
        <InlineText parts={parseInline(opinion)} />
      </blockquote>
      <figcaption className="mt-3 flex items-center gap-2.5">
        {avatar ? (
          <img
            src={avatar}
            alt=""
            width={32}
            height={32}
            loading="lazy"
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong"
          >
            {name.slice(0, 1) || '—'}
          </span>
        )}
        <span className="text-sm font-semibold text-ink">{name || 'Спикер'}</span>
      </figcaption>
    </figure>
  )
}

// Разбивает блоки темы на секции по заголовкам, чтобы отрисовать
// «Мнение спикера» особым образом, а остальное — обычным Markdown.
interface BodySection {
  heading?: Block & { type: 'heading' }
  blocks: Block[]
}

function splitSections(blocks: Block[]): BodySection[] {
  const sections: BodySection[] = []
  let current: BodySection = { blocks: [] }

  for (const block of blocks) {
    if (block.type === 'heading') {
      if (current.heading || current.blocks.length > 0) sections.push(current)
      current = { heading: block, blocks: [] }
    } else {
      current.blocks.push(block)
    }
  }
  if (current.heading || current.blocks.length > 0) sections.push(current)
  return sections
}

// Секция темы на странице главы: заголовок, спикеры, материалы, Markdown-тело.
function TopicSection({ topic, index }: TopicSectionProps) {
  const { meta, body } = topic
  const hasLinks = meta.video_youtube || meta.video_vk || meta.presentation
  const sections = splitSections(parseBlocks(body))

  return (
    <section
      aria-labelledby={meta.id}
      className="card reveal p-6"
      style={{ '--reveal-delay': `${index * 90}ms` } as React.CSSProperties}
    >
      <div className="flex items-baseline gap-3">
        <span aria-hidden="true" className="font-display text-2xl font-semibold text-line-strong">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 id={meta.id} className="font-display text-xl font-semibold text-ink">
          {meta.title}
        </h2>
      </div>

      {meta.speakers.length > 0 ? (
        <p className="mt-1.5 text-sm text-ink-faint">
          {meta.speakers.length > 1 ? 'Спикеры: ' : 'Спикер: '}
          {meta.speakers.join(', ')}
        </p>
      ) : null}

      <div className="mt-4">
        {sections.map((section, si) => {
          const isOpinion = section.heading && OPINION_HEADING.test(section.heading.text)
          return (
            <div key={si}>
              {section.heading ? <BlockView block={section.heading} /> : null}
              {isOpinion
                ? section.blocks.map((block, bi) =>
                    block.type === 'para' ? (
                      <SpeakerOpinion key={bi} text={block.text} />
                    ) : (
                      <BlockView key={bi} block={block} />
                    ),
                  )
                : section.blocks.map((block, bi) => <BlockView key={bi} block={block} />)}
            </div>
          )
        })}
      </div>

      {hasLinks || meta.resources.length > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            {meta.video_youtube ? (
              <a
                href={meta.video_youtube}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost px-4 py-2 text-xs"
              >
                <Icon name="play" size={14} />
                Запись на YouTube
              </a>
            ) : null}
            {meta.video_vk ? (
              <a
                href={meta.video_vk}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost px-4 py-2 text-xs"
              >
                <Icon name="play" size={14} />
                Запись в VK
              </a>
            ) : null}
            {meta.presentation ? (
              <a
                href={meta.presentation}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost px-4 py-2 text-xs"
              >
                <Icon name="file" size={14} />
                Презентация
              </a>
            ) : null}
          </div>

          {meta.resources.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {meta.resources.map((res) => (
                <li key={res} className="flex items-center gap-2 text-sm">
                  <Icon name="external" size={13} className="shrink-0 text-ink-faint" />
                  <a
                    href={res}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                  >
                    {res}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default TopicSection
