import { isPast } from './format'
import type {
  BookMeta,
  Chapter,
  ChapterWithSlug,
  ClubEvent,
  ClubSettings,
  ContentIndex,
  Flashcard,
  IndexBook,
  IndexChapter,
  IndexSpeaker,
  Topic,
} from '../types'

// Базовый URL данных книжного клуба (публичный репозиторий book-club-data).
// Переопределяется через VITE_RAW_BASE (см. .env.example).
export const RAW_BASE =
  import.meta.env.VITE_RAW_BASE ??
  'https://raw.githubusercontent.com/bookclubit/book-club-data/main'

// Единый реестр контента: книги (с главами), события, спикеры.
// Ведёт CMS — всё добавленное появляется здесь без правок кода miniapp.
// Кэшируется на время сессии: реестр нужен и синхронным хелперам
// (readingProgress, speakerAvatar), которые вызываются после загрузки данных.
let contentIndex: ContentIndex | null = null

export async function fetchIndex(): Promise<ContentIndex> {
  if (!contentIndex) {
    contentIndex = normalizeIndex(await fetcher<RawContentIndex>(`${RAW_BASE}/index.json`))
  }
  return contentIndex
}

// Реестр как он лежит в репозитории: в v1 главы были slug-ами, в v2 — объектами.
type RawContentIndex = Omit<ContentIndex, 'books'> & {
  books: Array<Omit<IndexBook, 'chapters'> & { chapters: Array<IndexChapter | string> }>
}

// raw.githubusercontent.com кэширует файлы несколько минут, поэтому сразу после
// выката приложение может получить ещё старый реестр. Приводим главы к объектам,
// чтобы расхождение форматов не ломало экраны.
function normalizeIndex(index: RawContentIndex): ContentIndex {
  return {
    ...index,
    books: index.books.map((book) => ({
      ...book,
      chapters: book.chapters.map((chapter, i) =>
        typeof chapter === 'string'
          ? { slug: chapter, order: i + 1, title: chapter, topics: 1 }
          : chapter,
      ),
    })),
  }
}

// Настройки клуба (ссылки на соцсети и т.п.). Файла может ещё не быть —
// тогда возвращаем пустые настройки, блок соцсетей просто не отрисуется.
export async function fetchSettings(): Promise<ClubSettings> {
  try {
    return await fetcher<ClubSettings>(`${RAW_BASE}/settings.json`)
  } catch {
    return { version: 1, socials: {} }
  }
}

// Репозиторий презентаций (book-club-talks): по нему проверяем, принята ли
// презентация спикера. Переопределяется через VITE_TALKS_RAW_BASE.
export const TALKS_RAW_BASE =
  import.meta.env.VITE_TALKS_RAW_BASE ??
  'https://raw.githubusercontent.com/bookclubit/book-club-talks/main'

// Папка доклада из slides_url: URL детерминирован — <папка-lowercase>.pages.dev.
// Для внешних ссылок (не pages.dev) папки нет.
function talkFolderFromSlides(url: string): string | undefined {
  try {
    const host = new URL(url).hostname
    if (!host.endsWith('.pages.dev')) return undefined
    return host.slice(0, -'.pages.dev'.length).toUpperCase()
  } catch {
    return undefined
  }
}

// Презентация «принята» = PR спикера смержен в book-club-talks, то есть папка
// доклада появилась в main. Внешние ссылки (вручную заданные, не pages.dev)
// считаем принятыми. Возвращает множество принятых slides_url.
// Ключ SWR: `slides-published:<urls>`.
export async function fetchPublishedSlides(urls: string[]): Promise<Set<string>> {
  const checked = await Promise.all(
    urls.map(async (url) => {
      const folder = talkFolderFromSlides(url)
      if (!folder) return url
      try {
        // raw.githubusercontent не поддерживает HEAD — только GET.
        const res = await fetch(`${TALKS_RAW_BASE}/talks/${folder}/index.html`)
        return res.ok ? url : undefined
      } catch {
        return undefined
      }
    }),
  )
  return new Set(checked.filter((u): u is string => Boolean(u)))
}

// Телеграм-бот клуба (book-club-bot, @bookclubfrontbot). Через него —
// регистрация спикеров: диплинк /start с полезной нагрузкой.
export const BOT_URL = 'https://t.me/bookclubfrontbot'

// Заявка на доклад — глобальная, не привязана к встрече: бот предложит
// темы из плана (кроме ближайшей встречи) или свою тему.
export function speakerUrl(): string {
  return `${BOT_URL}?start=speaker`
}

// --- Занятость тем (оперативные данные из D1 бота, не из git) ---

// HTTP API бота (Cloudflare Workers). Переопределяется через VITE_BOT_API.
export const BOT_API =
  import.meta.env.VITE_BOT_API ?? 'https://book-club-bot.vitrumbeta.workers.dev'

export interface TopicClaim {
  topic_id: string | null
  topic_title: string
  book_id: string | null
  chapter: string | null
  status: 'pending' | 'confirmed'
  speaker: string
  speaker_id: string | null // каталожный спикер, если бот узнал заявителя
  slides_url: string | null // ссылка на презентацию (talks)
}

export async function fetchClaims(): Promise<TopicClaim[]> {
  const data = await fetcher<{ claims: TopicClaim[] }>(`${BOT_API}/api/claims`)
  return data.claims
}

// Слот темы в плане: что можно взять себе на будущем эфире-«докладе».
export interface PlanSlot {
  topicId: string
  title: string
  eventId: string
  eventTitle: string
  date: string
  time: string
  stream?: number
  bookTitle?: string
}

// Свободные темы будущих эфиров-«докладов» (занятость — заявки D1 бота).
// Ключ SWR: 'plan-slots'. Бот проверяет тему заново при броне — здесь список
// только для выбора.
export async function fetchPlanSlots(): Promise<PlanSlot[]> {
  const [events, claims] = await Promise.all([fetchEvents(), fetchClaims()])
  const taken = new Set(claims.map((c) => c.topic_id).filter(Boolean))
  const upcoming = events.filter(
    (e) => e.type === 'live-talk' && !e.finished && !isPast(e.date) && e.book_id && e.chapter,
  )

  const slots: PlanSlot[] = []
  for (const event of upcoming) {
    const topics = await fetchEventChapterTopics(event.book_id!, event.chapter!)
    // Главу могли поделить между эфирами: тогда у встречи свой набор тем.
    const ids = event.type === 'live-talk' ? event.topic_ids : undefined
    const own = ids && ids.length > 0 ? topics.filter((t) => ids.includes(t.id)) : topics
    for (const topic of own) {
      if (taken.has(topic.id)) continue
      slots.push({
        topicId: topic.id,
        title: topic.title,
        eventId: event.id,
        eventTitle: event.title,
        date: event.date,
        time: event.time,
        ...(event.stream ? { stream: event.stream } : {}),
        ...(bookTitleById(event.book_id) ? { bookTitle: bookTitleById(event.book_id) } : {}),
      })
    }
  }
  return slots.sort((a, b) => a.date.localeCompare(b.date))
}

// Темы главы события для плана: book_id события может быть и id из meta,
// и именем папки — резолвим через реестр.
export async function fetchEventChapterTopics(
  bookId: string,
  chapterSlug: string,
): Promise<Topic[]> {
  const index = await fetchIndex()
  const folder =
    index.books.find((b) => b.id === bookId)?.folder ??
    index.books.find((b) => b.folder === bookId)?.folder
  if (!folder) return []
  try {
    const chapter = await fetcher<Chapter>(chapterUrl(folder, chapterSlug))
    return chapter.topics
  } catch {
    return []
  }
}

// Глава с темами и контекстом книги — для профиля спикера: доклады старых глав
// живут только в chapter.json (события за них в клубе не заводили).
export interface ChapterTopics {
  bookFolder: string
  chapterSlug: string
  chapterTitle: string
  chapterOrder: number
  topics: Topic[]
}

/**
 * Разобранные главы всех книг клуба. Ключ SWR: 'chapters-all'.
 * Пустые заготовки (в реестре `topics: 0`) не запрашиваем, недоступную главу
 * пропускаем — профиль спикера не должен падать из-за одного файла.
 */
export async function fetchAllChapters(): Promise<ChapterTopics[]> {
  const index = await fetchIndex()
  const wanted = index.books.flatMap((book) =>
    book.chapters.filter((c) => c.topics > 0).map((c) => ({ book, chapter: c })),
  )
  const loaded = await Promise.all(
    wanted.map(async ({ book, chapter }): Promise<ChapterTopics | null> => {
      try {
        const data = await fetcher<Chapter>(chapterUrl(book.folder, chapter.slug))
        return {
          bookFolder: book.folder,
          chapterSlug: chapter.slug,
          chapterTitle: data.title,
          chapterOrder: data.order,
          topics: data.topics,
        }
      } catch {
        return null
      }
    }),
  )
  return loaded.filter((c): c is ChapterTopics => c !== null)
}

// Имя папки книги по id из meta (в событиях и заявках книга указана как id,
// в главах и маршрутах — папкой). Нужен, чтобы фильтр по книге не двоился.
export function bookFolderById(bookId?: string): string | undefined {
  if (!bookId) return undefined
  return contentIndex?.books.find((b) => b.id === bookId || b.folder === bookId)?.folder
}

// Аватарка спикера по имени или алиасу (в темах спикер указан по имени).
// Реестр к моменту вызова уже загружен страницей; иначе просто без аватарки.
export function speakerAvatar(name: string): string | undefined {
  return mediaUrl(speakerByName(name)?.avatar)
}

// Спикер по имени или алиасу: в данных тема подписана как придётся
// («Антон», «Антон Помазков»). Чистая функция — компонентам, которые берут
// реестр через SWR и обязаны перерисоваться, когда он загрузится.
export function matchSpeaker(
  speakers: IndexSpeaker[],
  name: string,
): IndexSpeaker | undefined {
  return speakers.find((s) => s.name === name || s.aliases.includes(name))
}

// То же по кэшу реестра — для мест, где он к моменту вызова уже загружен
// страницей (иначе вернёт undefined и не перерисуется при загрузке).
export function speakerByName(name: string): IndexSpeaker | undefined {
  return matchSpeaker(contentIndex?.speakers ?? [], name)
}

// Спикеры клуба из реестра (профили: имя, аватар, био, соцсети). Ключ SWR: 'speakers'.
export async function fetchSpeakers(): Promise<IndexSpeaker[]> {
  const index = await fetchIndex()
  return index.speakers
}

// Название книги по её id (или имени папки) из реестра — для карточек встреч.
// Реестр к моменту вызова уже загружен (fetchEvents дёргает fetchIndex).
export function bookTitleById(bookId?: string): string | undefined {
  if (!bookId) return undefined
  return contentIndex?.books.find((b) => b.id === bookId || b.folder === bookId)?.title
}

// Прогресс чтения книги: доля разобранных глав от общего числа. Разобранная =
// глава, у которой в реестре есть хотя бы одна тема (пустые заготовки не в счёт).
export function readingProgress(folder: string, totalChapters: number): number {
  const chapters = contentIndex?.books.find((b) => b.folder === folder)?.chapters ?? []
  const done = chapters.filter((c) => c.topics > 0).length
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
// Темы приезжают внутри chapter.json — отдельных запросов на тему больше нет.
export async function fetchChapters(bookId: string): Promise<ChapterWithSlug[]> {
  const index = await fetchIndex()
  const entries = index.books.find((b) => b.folder === bookId)?.chapters ?? []
  const chapters = await Promise.all(
    entries.map(async ({ slug }) => {
      const chapter = await fetcher<Chapter>(chapterUrl(bookId, slug))
      return { ...chapter, slug }
    }),
  )
  return chapters.sort((a, b) => a.order - b.order)
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
