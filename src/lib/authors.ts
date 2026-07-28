// Авторы книг клуба. Отдельного каталога авторов в данных нет: автор живёт в
// meta.json своих книг, поэтому список авторов считается из уже загруженных мет
// (SWR-ключ 'books') — лишних запросов страница автора не делает.

import type { BookWithFolder } from './api'
import type { Author } from '../types'

/**
 * Ключ автора — то, по чему его книги собираются в одну страницу.
 * Правило повторяет генератор реестра (scripts/build-index.mjs в book-club-data)
 * и CMS: стабильный `id`, иначе имя файла аватарки, иначе имя.
 */
export function authorKey(author: Author): string {
  if (author.id) return author.id
  const file = (author.avatar ?? '').split('/').pop() ?? ''
  const base = file.replace(/\.[a-z0-9]+$/i, '')
  return base || author.name
}

export interface AuthorWithBooks {
  id: string
  name: string
  avatar?: string
  url?: string
  books: BookWithFolder[]
}

/**
 * Авторы всех книг клуба: по одной записи на человека, книги — в порядке
 * переданного списка. Аватар и ссылку берём из первой книги, где они заданы
 * (в разных книгах мета могла заполняться в разное время).
 */
export function collectAuthors(books: BookWithFolder[]): AuthorWithBooks[] {
  const byKey = new Map<string, AuthorWithBooks>()
  for (const book of books) {
    for (const author of book.meta.authors) {
      const id = authorKey(author)
      const entry = byKey.get(id) ?? { id, name: author.name, books: [] }
      if (author.avatar && !entry.avatar) entry.avatar = author.avatar
      if (author.url && !entry.url) entry.url = author.url
      if (!entry.books.some((b) => b.folder === book.folder)) entry.books.push(book)
      byKey.set(id, entry)
    }
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

/** Автор по ключу из маршрута /author/:authorId. */
export function findAuthor(
  books: BookWithFolder[],
  authorId: string,
): AuthorWithBooks | undefined {
  return collectAuthors(books).find((a) => a.id === authorId)
}
