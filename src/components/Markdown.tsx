import { parseBlocks, parseInline } from '../lib/markdown'
import type { Block, Inline } from '../lib/markdown'

// Рендерер доверенного Markdown из book-club-data.
// Заголовки ## внутри темы («Краткое описание», «Инсайты», «Мнение спикера»)
// оформляются как небольшие секционные ярлыки.

export function InlineText({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, i) => {
        switch (part.type) {
          case 'bold':
            return (
              <strong key={i} className="font-semibold text-ink">
                {part.text}
              </strong>
            )
          case 'italic':
            return <em key={i}>{part.text}</em>
          case 'code':
            return (
              <code
                key={i}
                className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
              >
                {part.text}
              </code>
            )
          case 'link':
            return (
              <a
                key={i}
                href={part.href}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
              >
                {part.text}
              </a>
            )
          default:
            return <span key={i}>{part.text}</span>
        }
      })}
    </>
  )
}

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return (
        <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint first:mt-0">
          {block.text}
        </p>
      )
    case 'para':
      return (
        <p className="my-2 text-[15px] leading-relaxed text-ink-soft">
          <InlineText parts={parseInline(block.text)} />
        </p>
      )
    case 'list':
      return (
        <ul className="my-2 space-y-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-2.25 h-1 w-3.5 shrink-0 rounded-full bg-accent/60" />
              <span>
                <InlineText parts={parseInline(item)} />
              </span>
            </li>
          ))}
        </ul>
      )
    case 'code':
      return (
        <pre className="my-3 overflow-x-auto rounded-btn bg-terminal p-4 font-mono text-[13px] leading-relaxed text-terminal-ink">
          <code>{block.code}</code>
        </pre>
      )
    case 'quote':
      return (
        <blockquote className="my-3 border-l-2 border-accent/50 pl-4 text-[15px] italic leading-relaxed text-ink-soft">
          <InlineText parts={parseInline(block.text)} />
        </blockquote>
      )
    default:
      return null
  }
}

function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source)
  return (
    <div>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  )
}

export default Markdown
