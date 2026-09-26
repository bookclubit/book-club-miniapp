// Первый вход на устройстве: всё, что человек успел как гость (колода и
// прогресс в localStorage), переносится в аккаунт. Иначе после входа колода
// «пустела», а повторённые карточки снова становились новыми. Переносим один
// раз на устройство и аккаунт: дальше localStorage — только кэш серверных
// данных, и книга, убранная на другом устройстве, отсюда не вернётся.

import { importProgress, mergeServerDeck, type ImportedProgress } from './account'
import { isDeckEmpty, loadDeck, saveDeck } from './deck'
import type { StudyProgress } from '../types'

const MS_PER_DAY = 24 * 60 * 60 * 1000
const PROGRESS_PREFIX = 'study-progress:'

const syncedKey = (userId: number) => `bc-synced:${userId}`

function wasSynced(userId: number): boolean {
  try {
    return localStorage.getItem(syncedKey(userId)) === '1'
  } catch {
    return true // localStorage недоступен — переносить всё равно нечего
  }
}

function markSynced(userId: number): void {
  try {
    localStorage.setItem(syncedKey(userId), '1')
  } catch {
    // игнорируем
  }
}

// Прогресс всех книг устройства в формате сервера.
function localProgress(): ImportedProgress[] {
  const items: ImportedProgress[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(PROGRESS_PREFIX)) continue
      const bookId = key.slice(PROGRESS_PREFIX.length)
      const progress = JSON.parse(localStorage.getItem(key) ?? '{}') as StudyProgress
      for (const [cardId, p] of Object.entries(progress)) {
        const due = Date.parse(p.dueDate)
        if (!Number.isFinite(due)) continue
        items.push({
          book_id: bookId,
          card_id: cardId,
          repetition: p.repetitions,
          interval: p.interval,
          easiness: p.easiness,
          due_date: due,
          // Когда повторяли, гостевой прогресс не хранит — выводим из срока и интервала.
          last_reviewed: Math.min(Date.now(), Math.max(0, due - p.interval * MS_PER_DAY)),
        })
      }
    }
  } catch {
    // Повреждённая запись — переносим то, что успели прочитать.
  }
  return items
}

/**
 * Переносит гостевые данные устройства в аккаунт (один раз). true — перенос
 * был, кэши колоды и прогресса пора обновить. Ошибка сети перенос сделанным
 * не помечает — попробуем при следующем запуске.
 */
export async function syncGuestData(userId: number): Promise<boolean> {
  if (wasSynced(userId)) return false
  const deck = loadDeck()
  if (!isDeckEmpty(deck)) saveDeck(await mergeServerDeck(deck))
  const progress = localProgress()
  if (progress.length > 0) await importProgress(progress)
  markSynced(userId)
  return true
}
