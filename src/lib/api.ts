import type {
  BookMeta,
  Chapter,
  ChapterWithSlug,
  Flashcard,
  Meeting,
} from '../types'

// Базовый URL данных книжного клуба (публичный репозиторий book-club-data).
export const RAW_BASE =
  'https://raw.githubusercontent.com/bookclubit/book-club-data/main'

// Книги, показываемые в приложении. Пока одна.
export const BOOK_IDS = ['docker-vvodnyy-kurs'] as const

// В репозитории данных нет индекса глав, а raw.githubusercontent.com не листает
// директории. Поэтому slug-и глав (имена папок) для каждой книги задаём здесь.
// При добавлении новых глав в данные — дополняй список.
export const CHAPTER_SLUGS: Record<string, string[]> = {
  'docker-vvodnyy-kurs': ['01-vvedenie'],
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

// --- Fetcher для SWR ---

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Не удалось загрузить данные (${res.status}): ${url}`)
  }
  return (await res.json()) as T
}

// Загружает meta.json всех книг из BOOK_IDS. Ключ SWR: 'books'.
export async function fetchBooks(): Promise<BookMeta[]> {
  return Promise.all(BOOK_IDS.map((id) => fetcher<BookMeta>(metaUrl(id))))
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

// Загружает карточки книги. Ключ SWR: flashcardsUrl(bookId).
export async function fetchFlashcards(bookId: string): Promise<Flashcard[]> {
  return fetcher<Flashcard[]>(flashcardsUrl(bookId))
}

// --- Заглушки: ближайшие встречи клуба ---

export const MEETINGS: Meeting[] = [
  {
    id: 'm-1',
    bookId: 'docker-vvodnyy-kurs',
    title: 'Разбор главы 1: Введение в Docker',
    date: '2026-07-14T19:00:00+03:00',
    chapter: 'Глава 1',
    place: 'Zoom',
  },
  {
    id: 'm-2',
    bookId: 'docker-vvodnyy-kurs',
    title: 'Разбор главы 2: Образы и Dockerfile',
    date: '2026-07-21T19:00:00+03:00',
    chapter: 'Глава 2',
    place: 'Zoom',
  },
]
