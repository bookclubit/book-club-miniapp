import type { Topic, TopicMeta, TopicRef } from '../types'

// Лёгкий парсер .md-файлов тем: YAML-frontmatter (плоский, простой)
// + разбор тела на блоки. Контент свой и доверенный, полноценный
// Markdown-движок не нужен.

// --- Frontmatter ---

type FrontmatterValue = string | number | string[]

function parseScalar(raw: string): string {
  const trimmed = raw.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function parseFrontmatter(text: string): Record<string, FrontmatterValue> {
  const result: Record<string, FrontmatterValue> = {}
  const lines = text.split('\n')
  let currentKey: string | null = null

  for (const line of lines) {
    if (!line.trim()) continue

    // Элемент списка под текущим ключом: "  - значение"
    const itemMatch = line.match(/^\s+-\s+(.*)$/)
    if (itemMatch && currentKey) {
      const list = result[currentKey]
      if (Array.isArray(list)) list.push(parseScalar(itemMatch[1]))
      continue
    }

    const kvMatch = line.match(/^([\w-]+):\s*(.*)$/)
    if (!kvMatch) continue
    const [, key, rawValue] = kvMatch
    const value = rawValue.trim()

    if (value === '[]') {
      result[key] = []
      currentKey = null
      continue
    }

    if (value === '') {
      // «key:» без значения — начало списка (элементы добавятся выше)
      result[key] = []
      currentKey = key
      continue
    }

    currentKey = null
    const num = Number(value)
    result[key] = value !== '' && !Number.isNaN(num) && /^\d+$/.test(value) ? num : parseScalar(value)
  }

  return result
}

function asString(value: FrontmatterValue | undefined): string {
  return typeof value === 'string' ? value : ''
}

function asList(value: FrontmatterValue | undefined): string[] {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

// Разбирает сырой .md темы на frontmatter и тело.
// ref (из chapter.json) — источник запасных значений id/title.
export function parseTopicMarkdown(raw: string, ref: TopicRef): Topic {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  const fm = match ? parseFrontmatter(match[1]) : {}
  const body = match ? raw.slice(match[0].length).trim() : raw.trim()

  const meta: TopicMeta = {
    id: asString(fm.id) || ref.id,
    title: asString(fm.title) || ref.title,
    order: typeof fm.order === 'number' ? fm.order : 0,
    video_youtube: asString(fm.video_youtube) || undefined,
    video_vk: asString(fm.video_vk) || undefined,
    presentation: asString(fm.presentation) || undefined,
    resources: asList(fm.resources),
    speakers: asList(fm.speakers),
  }

  return { meta, body }
}

// --- Блоки тела ---

export type Block =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'para'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; code: string }
  | { type: 'quote'; text: string }

export function parseBlocks(md: string): Block[] {
  const blocks: Block[] = []
  const lines = md.split(/\r?\n/)
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    if (line.startsWith('```')) {
      const code: string[] = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i])
        i += 1
      }
      i += 1 // закрывающая ```
      blocks.push({ type: 'code', code: code.join('\n') })
      continue
    }

    const heading = line.match(/^(##|###)\s+(.*)$/)
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading[1] === '##' ? 2 : 3,
        text: heading[2].trim(),
      })
      i += 1
      continue
    }

    if (line.startsWith('> ')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quote.push(lines[i].slice(2))
        i += 1
      }
      blocks.push({ type: 'quote', text: quote.join(' ') })
      continue
    }

    const unordered = /^[-*]\s+/.test(line)
    const ordered = /^\d+\.\s+/.test(line)
    if (unordered || ordered) {
      const items: string[] = []
      const itemRe = ordered ? /^\d+\.\s+/ : /^[-*]\s+/
      while (i < lines.length && itemRe.test(lines[i])) {
        items.push(lines[i].replace(itemRe, '').trim())
        i += 1
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    // Параграф: до пустой строки или начала другого блока
    const para: string[] = [line.trim()]
    i += 1
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(##|###|```|>|[-*]\s|\d+\.\s)/.test(lines[i])
    ) {
      para.push(lines[i].trim())
      i += 1
    }
    blocks.push({ type: 'para', text: para.join(' ') })
  }

  return blocks
}

// --- Инлайн-разметка: **жирный**, *курсив*, `код`, [текст](url) ---

export type Inline =
  | { type: 'text' | 'bold' | 'italic' | 'code'; text: string }
  | { type: 'link'; text: string; href: string }

const INLINE_RE =
  /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g

export function parseInline(text: string): Inline[] {
  const parts: Inline[] = []
  let last = 0

  for (const m of text.matchAll(INLINE_RE)) {
    const index = m.index ?? 0
    if (index > last) parts.push({ type: 'text', text: text.slice(last, index) })

    if (m[2] !== undefined) parts.push({ type: 'bold', text: m[2] })
    else if (m[4] !== undefined) parts.push({ type: 'italic', text: m[4] })
    else if (m[6] !== undefined) parts.push({ type: 'code', text: m[6] })
    else if (m[8] !== undefined) parts.push({ type: 'link', text: m[8], href: m[9] })

    last = index + m[0].length
  }

  if (last < text.length) parts.push({ type: 'text', text: text.slice(last) })
  return parts
}
