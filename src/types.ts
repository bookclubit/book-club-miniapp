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
  /** Ссылка на автора (сайт/профиль) — используется в презентациях talks. */
  url?: string
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
  /** Код книги для генератора презентаций (talks): DOCKER, REACT… */
  code?: string
  /** Ссылка на книгу (издательство/магазин) — используется в презентациях talks. */
  url?: string
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

/** Модератор открытого обсуждения — из числа спикеров клуба. */
export interface EventModerator {
  speaker_id: string
  name: string
  avatar: string
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
  notes_board_url?: string // доска — ссылка или загруженный файл (raw URL)
  call_url?: string // Google Meet — подключиться к обсуждению
  streams?: { youtube?: string; vk?: string }
  /** Номер стрима: показывается как «Книжный клуб <stream>». */
  stream?: number
  moderators?: EventModerator[]
  materials?: EventMaterial[]
  finished?: boolean // админ отметил встречу завершённой → уходит в архив
}

export interface LiveTalk {
  title: string
  speaker: string
  speaker_id: string
  avatar?: string
  topic_id?: string // id темы главы, к которой привязан доклад
  slides_url?: string // ссылка на презентацию (talks, Cloudflare Pages)
}

/** Монтажные ролики докладов встречи: id темы → ссылки на чистовую запись. */
export type EventRecordings = Record<string, { youtube?: string; vk?: string }>

export interface LiveTalkEvent {
  id: string
  type: 'live-talk'
  title: string
  date: string
  time: string
  timezone: string
  streams?: { youtube?: string; vk?: string }
  talks: LiveTalk[]
  call_url?: string
  materials?: EventMaterial[]
  /** Книга и глава программы эфира — из них бот предлагает темы спикерам. */
  book_id?: string
  chapter?: string
  /**
   * Темы главы, разбираемые именно на этой встрече (id тем). Нужно, когда главу
   * делят на несколько эфиров: каждый показывает только свои темы. Пусто/нет —
   * вся глава (обратная совместимость: одна встреча на главу).
   */
  topic_ids?: string[]
  /** Монтажные ролики докладов (id темы → ссылки); вносит админ после встречи. */
  recordings?: EventRecordings
  /** Номер стрима: показывается как «Книжный клуб <stream>». */
  stream?: number
  finished?: boolean // админ отметил встречу завершённой → уходит в архив
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

// Соцсети спикера (в его профиле). Порядок задаёт отрисовку иконок.
export type SpeakerSocial = 'telegram' | 'github' | 'linkedin' | 'website'

export const SPEAKER_SOCIALS: Array<{ id: SpeakerSocial; label: string }> = [
  { id: 'telegram', label: 'Telegram' },
  { id: 'github', label: 'GitHub' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'website', label: 'Сайт' },
]

export interface IndexSpeaker {
  id: string
  name: string
  aliases: string[]
  avatar: string
  bio?: string // краткое описание о себе
  socials?: Partial<Record<SpeakerSocial, string>>
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
