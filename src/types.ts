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
