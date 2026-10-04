import { cardsInScope, type CardScope } from './deck'
import { isDue } from './storage'
import type { BookStats, Flashcard, StudyProgress } from '../types'

// Части полосы освоения книги — общие для полосы (BookMastery) и её легенды
// на вкладке «Карточки»: цвет части и подпись в легенде не должны разойтись.
// «Новые» — остаток полосы, её фон.
export const MASTERY_PARTS = [
  { key: 'mature', label: 'выучено', className: 'bg-success' },
  { key: 'learning', label: 'изучаю', className: 'bg-accent' },
  { key: 'fresh', label: 'новые', className: 'bg-line-strong' },
] as const

// С какого интервала карточка выучена — то же число, что у бота
// (`MATURE_DAYS` в его lib/stats.ts).
const MATURE_DAYS = 21

/**
 * Освоение книги по прогрессу с устройства — гостю и когда статистика бота
 * недоступна. Правила те же, что у бота (`computeStats`): части считаются по
 * всем карточкам книги, «к повторению» — только по карточкам колоды.
 */
export function localBookStats(
  folder: string,
  title: string,
  cards: Flashcard[],
  scope: CardScope,
  progress: StudyProgress,
): BookStats {
  const inDeck = new Set(cardsInScope(cards, scope).map((card) => card.id))
  const stat: BookStats = {
    folder,
    title,
    in_deck: scope !== null,
    total: cards.length,
    fresh: 0,
    learning: 0,
    mature: 0,
    due: 0,
    last_reviewed: null,
  }
  for (const card of cards) {
    const p = progress[card.id]
    if (!p) stat.fresh++
    else if (p.interval >= MATURE_DAYS) stat.mature++
    else stat.learning++
    if (inDeck.has(card.id) && isDue(p)) stat.due++
  }
  return stat
}
