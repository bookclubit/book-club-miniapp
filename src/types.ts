// Общие типы приложения. Структуры соответствуют данным в репозитории book-club-data.

export type BookStatus = 'reading' | 'planned' | 'finished'

// Категория книги — вкладки-фильтры в каталоге. Клуб читает несколько книг
// параллельно, категории помогают ориентироваться в списке.
export type BookCategory = 'base' | 'algorithms' | 'tools' | 'frameworks' | 'ai'

export const BOOK_CATEGORIES: Array<{ id: BookCategory; label: string }> = [
  { id: 'base', label: 'База' },
  { id: 'algorithms', label: 'Алгоритмы' },
  { id: 'tools', label: 'Инструменты' },
  { id: 'frameworks', label: 'Фреймворки' },
  { id: 'ai', label: 'AI' },
]

export interface Author {
  name: string
  avatar?: string // путь относительно корня book-club-data, напр. /media/authors/x.webp
}

export interface BookMeta {
  id: string // id из meta.json (может отличаться от имени папки)
  title: string
  title_original?: string
  edition?: number
  authors: Author[]
  status: BookStatus
  category?: BookCategory
  cover?: string // путь относительно корня book-club-data
  tags: string[]
  description: string
  total_chapters: number
}

// Ссылка на тему внутри chapter.json
export interface TopicRef {
  id: string
  title: string
  file: string // имя .md-файла в папке главы
}

export interface Chapter {
  order: number
  title: string
  description: string
  learning_outcome: string
  topics: TopicRef[]
}

// Slug главы (имя папки) + её содержимое. slug нужен для маршрута /chapter/:chapterId.
export interface ChapterWithSlug extends Chapter {
  slug: string
}

// Frontmatter .md-файла темы
export interface TopicMeta {
  id: string
  title: string
  order: number
  video_youtube?: string
  video_vk?: string
  presentation?: string
  resources: string[]
  speakers: string[]
}

// Тема целиком: frontmatter + тело в Markdown
export interface Topic {
  meta: TopicMeta
  body: string
}

// --- События клуба (events/) ---

// Доп. материал встречи (статья, конспект, репозиторий…).
export interface EventMaterial {
  title: string
  url: string
}

/** «Открытое обсуждение» — разбор главы, прийти может любой (стримы + Meet). */
export interface ClosedChapterEvent {
  id: string
  type: 'closed-chapter'
  title: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  timezone: string
  book_id: string
  chapter: string // slug главы
  pages?: { from: number; to: number }
  notes_board_url?: string
  call_url?: string // Google Meet — подключиться к обсуждению
  streams?: { youtube?: string; vk?: string }
  materials?: EventMaterial[]
}

export interface LiveTalk {
  title: string
  speaker: string
  speaker_id: string
  avatar?: string
}

export interface LiveTalkEvent {
  id: string
  type: 'live-talk'
  title: string
  date: string
  time: string
  timezone: string
  streams?: { youtube?: string; vk?: string }
  talks: LiveTalk[]
  registration_url?: string
  call_url?: string
  materials?: EventMaterial[]
  /** Книга и глава программы эфира — из них бот предлагает темы спикерам. */
  book_id?: string
  chapter?: string
}

export type ClubEvent = ClosedChapterEvent | LiveTalkEvent

export type FlashcardType = 'qa' | 'command'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Flashcard {
  id: string
  type: FlashcardType
  chapter: string
  difficulty: Difficulty
  // Поля для type === 'qa'
  question?: string
  answer?: string
  // Поля для type === 'command'
  command?: string
  result?: string
}

// --- Прогресс изучения (SM-2), хранится в localStorage ---

export interface CardProgress {
  repetitions: number // число успешных повторений подряд
  interval: number // интервал в днях до следующего показа
  easiness: number // фактор лёгкости (EF)
  dueDate: string // ISO-дата следующего повторения
}

export type StudyProgress = Record<string, CardProgress>

// Оценка ответа пользователем (влияет на SM-2).
export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy'

// --- Единый реестр контента (index.json в корне book-club-data) ---
// raw.githubusercontent.com не листает директории, поэтому список книг, глав,
// событий и спикеров ведёт CMS в index.json; приложение читает его при старте.

export interface IndexBook {
  folder: string
  id: string
  title: string
  status: BookStatus
  category?: BookCategory
  chapters: string[] // slug-и папок глав
}

export interface IndexSpeaker {
  id: string
  name: string
  aliases: string[]
  avatar: string
}

export interface ContentIndex {
  version: 1
  active_book: string
  books: IndexBook[]
  events: string[] // пути относительно events/
  speakers: IndexSpeaker[]
}

// --- Настройки клуба (settings.json в корне book-club-data) ---
// Общие параметры, не привязанные к контенту: ссылки на соцсети клуба.
// Ведёт CMS (страница «Настройки»), miniapp читает при старте.

export type SocialPlatform = 'telegram' | 'youtube' | 'vk' | 'boosty' | 'github'

// Фиксированный набор и порядок соцсетей клуба (иконки в едином стиле).
export const SOCIAL_PLATFORMS: Array<{ id: SocialPlatform; label: string }> = [
  { id: 'telegram', label: 'Telegram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'vk', label: 'VK' },
  { id: 'boosty', label: 'Boosty' },
  { id: 'github', label: 'GitHub' },
]

export interface ClubSettings {
  version: 1
  socials: Partial<Record<SocialPlatform, string>> // платформа → URL (пусто = скрыта)
}
