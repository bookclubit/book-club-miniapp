// Колода текущего человека. Вошедшим — с сервера: она общая с ботом, и по ней
// он напоминает о повторении. Гостям — из localStorage. Изменения видны сразу
// (оптимистично), а сервер отвечает колодой после изменения.

import useSWR, { mutate as mutateGlobal } from 'swr'
import { changeServerDeck, fetchServerDeck } from './account'
import { EMPTY_DECK, loadDeck, saveDeck, withBook, withoutBook } from './deck'
import { useAuth } from './useAuth'
import type { Deck } from '../types'

export interface DeckState {
  deck: Deck
  // Колода загружена (у вошедших — с сервера): до этого решать по ней рано.
  ready: boolean
  addBook: (folder: string) => Promise<void>
  removeBook: (folder: string) => Promise<void>
}

export function useDeck(): DeckState {
  const { user, loading } = useAuth()
  const userId = user?.id
  const key = loading ? null : userId !== undefined ? `deck:${userId}` : 'deck:guest'

  const { data, mutate } = useSWR<Deck>(key, async () => {
    if (userId === undefined) return loadDeck()
    try {
      const deck = await fetchServerDeck()
      saveDeck(deck) // кэш на устройстве
      return deck
    } catch {
      // Сервер недоступен — повторять можно по копии колоды на устройстве,
      // как и прогресс в Study. Изменить колоду без сервера не выйдет.
      return loadDeck()
    }
  })

  async function change(action: 'add' | 'remove', folder: string): Promise<void> {
    const current = data ?? loadDeck()
    const next = action === 'add' ? withBook(current, folder) : withoutBook(current, folder)
    if (userId === undefined) {
      saveDeck(next)
      await mutate(next, { revalidate: false })
      return
    }
    await mutate(
      changeServerDeck(action, folder).then((deck) => {
        saveDeck(deck)
        return deck
      }),
      { optimisticData: next, rollbackOnError: true, revalidate: false },
    )
    // Статистика считается по колоде — пересчитаем.
    void mutateGlobal(`stats:${userId}`)
  }

  return {
    deck: data ?? EMPTY_DECK,
    ready: data !== undefined,
    addBook: (folder) => change('add', folder),
    removeBook: (folder) => change('remove', folder),
  }
}
