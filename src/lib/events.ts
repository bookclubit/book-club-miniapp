import { hasEnded } from './format'
import type { ClubEvent, ProgramBlock } from '../types'

/**
 * Встреча прошла — единственное правило на всё приложение.
 *
 * Правило одно, потому что «прошедшесть» видна в трёх местах: вкладки
 * «План»/«Архив», блок ближайших встреч на главной и сама карточка встречи
 * («прошла», записи вместо «Подключиться»). Раньше каждое место решало
 * по-своему (`finished`, `date >= today`), и встреча, которая уже закончилась,
 * висела в плане до тех пор, пока админ не отметит её завершённой.
 *
 * Флаг `finished` админа остаётся: им можно отправить встречу в архив раньше
 * (отменили, перенесли) — но ждать его не нужно.
 */
export function isArchived(event: ClubEvent): boolean {
  return Boolean(event.finished) || hasEnded(event.date, event.time)
}

/**
 * Программа эфира блоками — единственное место, где решается, откуда её брать.
 *
 * Новые встречи хранят её в `program` (за вечер разбирают несколько глав и даже
 * книг), старые — книгой и главой прямо в событии; это тот же единственный
 * блок. То же правило в боте (`lib/events.ts`) и CMS.
 */
export function eventProgram(event: ClubEvent): ProgramBlock[] {
  if (event.type !== 'live-talk') return []
  const blocks = (event.program ?? []).filter((b) => b.book_id && b.chapter)
  if (blocks.length > 0) return blocks
  if (!event.book_id || !event.chapter) return []
  return [{ book_id: event.book_id, chapter: event.chapter, topic_ids: event.topic_ids }]
}

/** Книги встречи (id как в событии) — их может быть несколько. */
export function eventBookIds(event: ClubEvent): string[] {
  if (event.type === 'closed-chapter') return [event.book_id]
  const ids = eventProgram(event).map((b) => b.book_id)
  return [...new Set(ids)]
}
