// Персональная колода пользователя (localStorage): что человек добавил себе
// к изучению. Хранится как ПОДПИСКИ, а не замороженный список карточек —
// поэтому новые карточки в подписанных книгах/главах подгружаются автоматически.
//
//   books    — папки книг, подписанные целиком (все карточки, включая будущие)
//   chapters — ключи `${folder}::${order}` для подписки на отдельную главу
//              (order — номер главы; в карточках поле chapter = номер строкой)

import type { Flashcard } from '../types'

export interface Deck {
  books: string[]
  chapters: string[]
}

const KEY = 'study-deck'

export function chapterKey(folder: string, order: number | string): string {
  return `${folder}::${order}`
}

export function loadDeck(): Deck {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { books: [], chapters: [] }
    const d = JSON.parse(raw) as Partial<Deck>
    return { books: d.books ?? [], chapters: d.chapters ?? [] }
  } catch {
    return { books: [], chapters: [] }
  }
}

function saveDeck(deck: Deck): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(deck))
  } catch {
    // localStorage недоступен — тихо игнорируем.
  }
}

export function isBookInDeck(folder: string): boolean {
  return loadDeck().books.includes(folder)
}

// Глава в колоде, если подписана книга целиком ИЛИ именно эта глава.
export function isChapterInDeck(folder: string, order: number | string): boolean {
  const d = loadDeck()
  return d.books.includes(folder) || d.chapters.includes(chapterKey(folder, order))
}

// Подписать книгу целиком: отдельные подписки на её главы становятся лишними.
export function addBookToDeck(folder: string): Deck {
  const d = loadDeck()
  const next: Deck = {
    books: d.books.includes(folder) ? d.books : [...d.books, folder],
    chapters: d.chapters.filter((k) => !k.startsWith(`${folder}::`)),
  }
  saveDeck(next)
  return next
}

export function removeBookFromDeck(folder: string): Deck {
  const d = loadDeck()
  const next: Deck = {
    books: d.books.filter((f) => f !== folder),
    chapters: d.chapters.filter((k) => !k.startsWith(`${folder}::`)),
  }
  saveDeck(next)
  return next
}

// Подписать одну главу (если книга уже подписана целиком — ничего не меняем).
export function addChapterToDeck(folder: string, order: number | string): Deck {
  const d = loadDeck()
  if (d.books.includes(folder)) return d
  const key = chapterKey(folder, order)
  if (d.chapters.includes(key)) return d
  const next: Deck = { books: d.books, chapters: [...d.chapters, key] }
  saveDeck(next)
  return next
}

export function removeChapterFromDeck(folder: string, order: number | string): Deck {
  const d = loadDeck()
  const next: Deck = {
    books: d.books,
    chapters: d.chapters.filter((k) => k !== chapterKey(folder, order)),
  }
  saveDeck(next)
  return next
}

// Какие карточки книги в колоде: 'all' | набор номеров глав | null (ничего).
export type CardScope = 'all' | Set<string> | null

export function bookCardScope(folder: string, deck: Deck = loadDeck()): CardScope {
  if (deck.books.includes(folder)) return 'all'
  const orders = deck.chapters
    .filter((k) => k.startsWith(`${folder}::`))
    .map((k) => k.slice(folder.length + 2))
  return orders.length ? new Set(orders) : null
}

// Отбирает из карточек книги те, что попадают в колоду по её scope.
export function cardsInScope(cards: Flashcard[], scope: CardScope): Flashcard[] {
  if (scope === 'all') return cards
  if (!scope) return []
  return cards.filter((c) => scope.has(String(c.chapter)))
}
