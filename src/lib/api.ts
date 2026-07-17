import type {
  BookMeta,
  Chapter,
  ChapterWithSlug,
  ClubEvent,
  ContentIndex,
  Flashcard,
  Topic,
} from '../types'
import { parseTopicMarkdown } from './markdown'

// Базовый URL данных книжного клуба (публичный репозиторий book-club-data).
export const RAW_BASE =
  'https://raw.githubusercontent.com/bookclubit/book-club-data/main'

// Единый реестр контента: книги (с главами), события, спикеры.
// Ведёт CMS — всё добавленное появляется здесь без правок кода miniapp.
// Кэшируется на время сессии: реестр нужен и синхронным хелперам
// (readingProgress, speakerAvatar), которые вызываются после загрузки данных.
let contentIndex: ContentIndex | null = null

export async function fetchIndex(): Promise<ContentIndex> {
  if (!contentIndex) {
    contentIndex = await fetcher<ContentIndex>(`${RAW_BASE}/index.json`)
  }
  return contentIndex
}

// Телеграм-бот клуба (book-club-bot, @bookclubfrontbot). Через него —
// регистрация спикеров: диплинк /start с полезной нагрузкой.
export const BOT_URL = 'https://t.me/bookclubfrontbot'

export function speakerRegistrationUrl(eventId: string): string {
  return `${BOT_URL}?start=speaker_${eventId}`
}

// Аватарка спикера по имени или алиасу (в .md-темах спикер указан по имени).
// Реестр к моменту вызова уже загружен страницей; иначе просто без аватарки.
export function speakerAvatar(name: string): string | undefined {
  const speaker = contentIndex?.speakers.find(
    (s) => s.name === name || s.aliases.includes(name),
  )
  return mediaUrl(speaker?.avatar)
}

// Прогресс чтения книги: доля разобранных глав (из реестра) от общего числа.
export function readingProgress(folder: string, totalChapters: number): number {
  const done =
    contentIndex?.books.find((b) => b.folder === folder)?.chapters.length ?? 0
  if (totalChapters <= 0) return 0
  return Math.min(100, Math.round((done / totalChapters) * 100))
}

// --- URL-хелперы ---

export function metaUrl(bookId: string): string {
  return `${RAW_BASE}/books/${bookId}/meta.json`
}

export function flashcardsUrl(bookId: string): string {
  return `${RAW_BASE}/books/${bookId}/flashcards.json`
}

export function chapterUrl(bookId: string, chapterSlug: string): string {
  return `${RAW_BASE}/books/${bookId}/chapters/${chapterSlug}/chapter.json`
}

export function topicUrl(bookId: string, chapterSlug: string, file: string): string {
  return `${RAW_BASE}/books/${bookId}/chapters/${chapterSlug}/${file}`
}

// Пути в данных (cover, avatar) заданы относительно корня репозитория: /media/...
export function mediaUrl(path?: string): string | undefined {
  if (!path) return undefined
  return path.startsWith('http') ? path : `${RAW_BASE}${path}`
}

// --- Fetcher для SWR ---

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Не удалось загрузить данные (${res.status}): ${url}`)
  }
  return (await res.json()) as T
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Не удалось загрузить данные (${res.status}): ${url}`)
  }
  return res.text()
}

// Загружает meta.json всех книг из реестра. Ключ SWR: 'books'.
// Возвращает пары «имя папки + мета», т.к. маршруты строятся по имени папки.
export interface BookWithFolder {
  folder: string
  meta: BookMeta
}

export async function fetchBooks(): Promise<BookWithFolder[]> {
  const index = await fetchIndex()
  return Promise.all(
    index.books.map(async ({ folder }) => ({
      folder,
      meta: await fetcher<BookMeta>(metaUrl(folder)),
    })),
  )
}

// Загружает все главы книги вместе с их slug-ами. Ключ SWR: `chapters:${bookId}`.
export async function fetchChapters(bookId: string): Promise<ChapterWithSlug[]> {
  const index = await fetchIndex()
  const slugs = index.books.find((b) => b.folder === bookId)?.chapters ?? []
  const chapters = await Promise.all(
    slugs.map(async (slug) => {
      const chapter = await fetcher<Chapter>(chapterUrl(bookId, slug))
      return { ...chapter, slug }
    }),
  )
  return chapters.sort((a, b) => a.order - b.order)
}

// Загружает все темы главы (.md с frontmatter). Ключ SWR: `topics:${bookId}:${slug}`.
export async function fetchTopics(
  bookId: string,
  chapterSlug: string,
  chapter: Chapter,
): Promise<Topic[]> {
  const topics = await Promise.all(
    chapter.topics.map(async (ref) => {
      const raw = await fetchText(topicUrl(bookId, chapterSlug, ref.file))
      return parseTopicMarkdown(raw, ref)
    }),
  )
  return topics.sort((a, b) => a.meta.order - b.meta.order)
}

// Загружает карточки книги. У книги может ещё не быть flashcards.json — тогда пусто.
export async function fetchFlashcards(bookId: string): Promise<Flashcard[]> {
  const res = await fetch(flashcardsUrl(bookId))
  if (res.status === 404) return []
  if (!res.ok) {
    throw new Error(`Не удалось загрузить карточки (${res.status})`)
  }
  return (await res.json()) as Flashcard[]
}

// Загружает события клуба из events/ (список — в реестре). Ключ SWR: 'events'.
export async function fetchEvents(): Promise<ClubEvent[]> {
  const index = await fetchIndex()
  const events = await Promise.all(
    index.events.map((file) => fetcher<ClubEvent>(`${RAW_BASE}/events/${file}`)),
  )
  return events.sort((a, b) => a.date.localeCompare(b.date))
}
