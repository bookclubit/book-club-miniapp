import type {
  BookMeta,
  Chapter,
  ChapterWithSlug,
  ClubEvent,
  Flashcard,
  Topic,
} from '../types'
import { parseTopicMarkdown } from './markdown'

// Базовый URL данных книжного клуба (публичный репозиторий book-club-data).
export const RAW_BASE =
  'https://raw.githubusercontent.com/bookclubit/book-club-data/main'

// Книги, показываемые в приложении (имена папок в books/).
export const BOOK_IDS = ['docker-up-and-running', 'fluent-react'] as const

// В репозитории данных нет индекса глав, а raw.githubusercontent.com не листает
// директории. Поэтому slug-и глав (имена папок) для каждой книги задаём здесь.
// При добавлении новых глав в данные — дополняй список.
export const CHAPTER_SLUGS: Record<string, string[]> = {
  'docker-up-and-running': ['01-vvedenie'],
  'fluent-react': [],
}

// Аналогично — список файлов событий в events/. Дополняй при добавлении встреч.
export const EVENT_FILES = [
  'closed-chapters/2026-07-20-docker-glava-01.json',
  'live-talks/2026-07-25-docker-doklady.json',
]

// Телеграм-бот клуба (book-club-bot, @bookclubfrontbot). Через него —
// регистрация спикеров: диплинк /start с полезной нагрузкой.
export const BOT_URL = 'https://t.me/bookclubfrontbot'

export function speakerRegistrationUrl(eventId: string): string {
  return `${BOT_URL}?start=speaker_${eventId}`
}

// Аватарки спикеров клуба (media/speakers/). В .md-темах спикер указан по имени.
export const SPEAKERS: Record<string, string> = {
  Антон: '/media/speakers/pomazkov-anton.webp',
  'Антон Помазков': '/media/speakers/pomazkov-anton.webp',
  Артём: '/media/speakers/nikiforov-artem.webp',
  'Артём Никифоров': '/media/speakers/nikiforov-artem.webp',
}

export function speakerAvatar(name: string): string | undefined {
  return mediaUrl(SPEAKERS[name])
}

// Прогресс чтения книги: доля разобранных глав (по CHAPTER_SLUGS) от общего числа.
export function readingProgress(folder: string, totalChapters: number): number {
  const done = CHAPTER_SLUGS[folder]?.length ?? 0
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

// Загружает meta.json всех книг из BOOK_IDS. Ключ SWR: 'books'.
// Возвращает пары «имя папки + мета», т.к. маршруты строятся по имени папки.
export interface BookWithFolder {
  folder: string
  meta: BookMeta
}

export async function fetchBooks(): Promise<BookWithFolder[]> {
  return Promise.all(
    BOOK_IDS.map(async (folder) => ({
      folder,
      meta: await fetcher<BookMeta>(metaUrl(folder)),
    })),
  )
}

// Загружает все главы книги вместе с их slug-ами. Ключ SWR: `chapters:${bookId}`.
export async function fetchChapters(bookId: string): Promise<ChapterWithSlug[]> {
  const slugs = CHAPTER_SLUGS[bookId] ?? []
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

// Загружает события клуба из events/. Ключ SWR: 'events'. Сортировка по дате.
export async function fetchEvents(): Promise<ClubEvent[]> {
  const events = await Promise.all(
    EVENT_FILES.map((file) => fetcher<ClubEvent>(`${RAW_BASE}/events/${file}`)),
  )
  return events.sort((a, b) => a.date.localeCompare(b.date))
}
