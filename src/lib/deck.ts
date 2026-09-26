// Персональная колода: что человек добавил себе к изучению. Хранится как
// ПОДПИСКИ, а не замороженный список карточек — поэтому новые карточки
// в подписанных книгах/главах подгружаются автоматически.
//
//   books    — папки книг, подписанные целиком (все карточки, включая будущие)
//   chapters — ключи `${folder}::${order}` для подписки на отдельную главу
//              (order — номер главы; в карточках поле chapter = номер строкой).
//              Подписаться на главу больше негде: своей страницы у главы нет,
//              в колоду добавляется книга целиком. Старые подписки читаем —
//              у кого они уже есть, повторение по ним работает как раньше.
//
// Вошедшим колода хранится на сервере и общая с ботом — по ней он напоминает
// о повторении. Здесь — гостевое хранилище (localStorage) и чистые хелперы;
// кто откуда читает, решает lib/useDeck.ts.

import type { Deck, Flashcard } from '../types'

const KEY = 'study-deck'

export const EMPTY_DECK: Deck = { books: [], chapters: [] }

export function loadDeck(): Deck {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return EMPTY_DECK
    const d = JSON.parse(raw) as Partial<Deck>
    return { books: d.books ?? [], chapters: d.chapters ?? [] }
  } catch {
    return EMPTY_DECK
  }
}

export function saveDeck(deck: Deck): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(deck))
  } catch {
    // localStorage недоступен — тихо игнорируем.
  }
}

export function isDeckEmpty(deck: Deck): boolean {
  return deck.books.length === 0 && deck.chapters.length === 0
}

// Книги колоды: целиком и те, от которых в колоде отдельные главы.
export function deckFolders(deck: Deck): string[] {
  return [...new Set([...deck.books, ...deck.chapters.map((k) => k.split('::')[0])])]
}

// Книга целиком: отдельные подписки на её главы становятся лишними.
export function withBook(deck: Deck, folder: string): Deck {
  return {
    books: deck.books.includes(folder) ? deck.books : [...deck.books, folder],
    chapters: deck.chapters.filter((k) => !k.startsWith(`${folder}::`)),
  }
}

export function withoutBook(deck: Deck, folder: string): Deck {
  return {
    books: deck.books.filter((f) => f !== folder),
    chapters: deck.chapters.filter((k) => !k.startsWith(`${folder}::`)),
  }
}

// Какие карточки книги в колоде: 'all' | набор номеров глав | null (ничего).
export type CardScope = 'all' | Set<string> | null

export function bookCardScope(folder: string, deck: Deck): CardScope {
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
