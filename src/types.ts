// Общие типы приложения. Структуры соответствуют данным в репозитории book-club-data.

export type BookStatus = 'reading' | 'planned' | 'finished'

export interface BookMeta {
  id: string
  title: string
  title_original?: string
  edition?: number
  authors: string[]
  status: BookStatus
  cover?: string
  tags: string[]
  description: string
  total_chapters: number
}

export interface SpeakerNote {
  speaker: string
  avatar?: string
  opinion: string
}

export interface Subchapter {
  id: string
  title: string
  summary: string
  insights: string[]
  speaker_notes: SpeakerNote[]
}

export interface Chapter {
  order: number
  title: string
  description: string
  learning_outcome: string
  subchapters: Subchapter[]
}

// Slug главы (имя папки) + её содержимое. slug нужен для маршрута /chapter/:chapterId.
export interface ChapterWithSlug extends Chapter {
  slug: string
}

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

// Заглушка для блока ближайших встреч на Home.
export interface Meeting {
  id: string
  bookId: string
  title: string
  date: string // ISO-строка
  chapter: string
  place: string
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
