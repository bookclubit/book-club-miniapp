import type { CardProgress, ReviewGrade, StudyProgress } from '../types'

// Ключ в localStorage для прогресса конкретной книги.
function storageKey(bookId: string): string {
  return `study-progress:${bookId}`
}

// Начальное состояние карточки (ещё не изучалась).
export function defaultCardProgress(): CardProgress {
  return {
    repetitions: 0,
    interval: 0,
    easiness: 2.5,
    dueDate: new Date().toISOString(),
  }
}

// Оценка пользователя -> quality (q) из алгоритма SM-2 (шкала 0..5).
const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 1,
  hard: 3,
  good: 4,
  easy: 5,
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

// Чистая реализация SM-2: по прошлому прогрессу и оценке возвращает новый прогресс.
export function reviewCard(prev: CardProgress, grade: ReviewGrade): CardProgress {
  const q = GRADE_QUALITY[grade]

  // Новый фактор лёгкости (EF), не ниже 1.3.
  const easiness = Math.max(
    1.3,
    prev.easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  )

  let repetitions: number
  let interval: number

  if (q < 3) {
    // Ответ провален — начинаем повторения заново.
    repetitions = 0
    interval = 1
  } else {
    repetitions = prev.repetitions + 1
    if (repetitions === 1) {
      interval = 1
    } else if (repetitions === 2) {
      interval = 6
    } else {
      interval = Math.round(prev.interval * easiness)
    }
  }

  const dueDate = new Date(Date.now() + interval * MS_PER_DAY).toISOString()

  return { repetitions, interval, easiness, dueDate }
}

// Карточка готова к показу, если её dueDate уже наступил (или карточка новая).
export function isDue(progress: CardProgress | undefined, now = Date.now()): boolean {
  if (!progress) return true
  return new Date(progress.dueDate).getTime() <= now
}

// --- Работа с localStorage ---

export function loadProgress(bookId: string): StudyProgress {
  try {
    const raw = localStorage.getItem(storageKey(bookId))
    if (!raw) return {}
    return JSON.parse(raw) as StudyProgress
  } catch {
    return {}
  }
}

export function saveProgress(bookId: string, progress: StudyProgress): void {
  try {
    localStorage.setItem(storageKey(bookId), JSON.stringify(progress))
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — тихо игнорируем.
  }
}

export function resetProgress(bookId: string): void {
  try {
    localStorage.removeItem(storageKey(bookId))
  } catch {
    // игнорируем
  }
}
