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

// Источник списков — единый реестр index.json в book-club-data (его
// поддерживает Codex CMS в каждом PR с контентом). Константы ниже — фолбэк
// на случай, когда index.json недоступен (например, ещё не смержен).

// Книги, показываемые в приложении (имена папок в books/).
export const BOOK_IDS = ['docker-up-and-running', 'fluent-react'] as const

// Slug-и глав (имена папок) для каждой книги.
export const CHAPTER_SLUGS: Record<string, string[]> = {
  'docker-up-and-running': ['01-vvedenie'],
  'fluent-react': [],
}

// Список файлов событий в events/.
export const EVENT_FILES = [
  'closed-chapters/2026-07-20-docker-glava-01.json',
  'live-talks/2026-07-25-docker-doklady.json',
]

// --- Единый реестр контента ---

// Актуальные таблицы для синхронных хелперов (speakerAvatar, readingProgress).
// Инициализируются фолбэком и обновляются после загрузки index.json — к моменту
// рендера контента реестр уже загружен, т.к. все fetch-функции ждут fetchIndex().
let chapterSlugs: Record<string, string[]> = CHAPTER_SLUGS
let speakerAvatars: Record<string, string> | null = null

let indexPromise: Promise<ContentIndex | null> | null = null

// Загружает index.json один раз за сессию. null — реестра нет или он битый.
export function fetchIndex(): Promise<ContentIndex | null> {
  indexPromise ??= fetch(`${RAW_BASE}/index.json`)
    .then((res) => (res.ok ? (res.json() as Promise<ContentIndex>) : null))
    .then((index) => {
      if (index) {
        chapterSlugs = Object.fromEntries(
          index.books.map((b) => [b.folder, b.chapters]),
        )
        speakerAvatars = {}
        for (const speaker of index.speakers) {
          for (const alias of [speaker.name, ...speaker.aliases]) {
            speakerAvatars[alias] = speaker.avatar
          }
        }
      }
      return index
    })
    .catch(() => null)
  return indexPromise
}

// Телеграм-бот клуба (book-club-bot, @bookclubfrontbot). Через него —
// регистрация спикеров: диплинк /start с полезной нагрузкой.
export const BOT_URL = 'https://t.me/bookclubfrontbot'

export function speakerRegistrationUrl(eventId: string): string {
  return `${BOT_URL}?start=speaker_${eventId}`
}

// Аватарки спикеров клуба (media/speakers/). В .md-темах спикер указан по имени.
// Фолбэк — реестр из index.json приоритетнее.
export const SPEAKERS: Record<string, string> = {
  Антон: '/media/speakers/pomazkov-anton.webp',
  'Антон Помазков': '/media/speakers/pomazkov-anton.webp',
  Артём: '/media/speakers/nikiforov-artem.webp',
  'Артём Никифоров': '/media/speakers/nikiforov-artem.webp',
}

export function speakerAvatar(name: string): string | undefined {
  return mediaUrl((speakerAvatars ?? SPEAKERS)[name])
}

// Прогресс чтения книги: доля разобранных глав от общего числа.
export function readingProgress(folder: string, totalChapters: number): number {
  const done = chapterSlugs[folder]?.length ?? 0
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

// Загружает meta.json всех книг (список — из index.json, фолбэк BOOK_IDS).
// Ключ SWR: 'books'. Возвращает пары «имя папки + мета», т.к. маршруты
// строятся по имени папки.
export interface BookWithFolder {
  folder: string
  meta: BookMeta
}

export async function fetchBooks(): Promise<BookWithFolder[]> {
  const index = await fetchIndex()
  const folders = index?.books.map((b) => b.folder) ?? [...BOOK_IDS]
  return Promise.all(
    folders.map(async (folder) => ({
      folder,
      meta: await fetcher<BookMeta>(metaUrl(folder)),
    })),
  )
}

// Загружает все главы книги вместе с их slug-ами. Ключ SWR: `chapters:${bookId}`.
export async function fetchChapters(bookId: string): Promise<ChapterWithSlug[]> {
  const index = await fetchIndex()
  const slugs =
    index?.books.find((b) => b.folder === bookId)?.chapters ??
    CHAPTER_SLUGS[bookId] ??
    []
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
  const index = await fetchIndex()
  const files = index?.events ?? EVENT_FILES
  const events = await Promise.all(
    files.map((file) => fetcher<ClubEvent>(`${RAW_BASE}/events/${file}`)),
  )
  return events.sort((a, b) => a.date.localeCompare(b.date))
}
