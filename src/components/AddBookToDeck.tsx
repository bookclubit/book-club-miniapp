import { useState } from 'react'
import { Link } from 'react-router-dom'
import { plural } from '../lib/format'
import { useAuth } from '../lib/useAuth'
import { useDeck } from '../lib/useDeck'
import Icon from './Icon'

/**
 * Кнопка «в колоду» на странице книги: подписывает на ВСЕ карточки книги
 * (новые подгрузятся сами). Когда книга уже в колоде — ведёт к повторению
 * и позволяет отписаться. У вошедших колода общая с ботом: он напоминает
 * о повторении.
 *
 * Стоит под обложкой, поэтому по ширине колонки: короткая подпись на кнопке,
 * число карточек и статус — мелкой строкой под ней.
 */
function AddBookToDeck({ bookId, count }: { bookId: string; count: number }) {
  const { user } = useAuth()
  const { deck, ready, addBook, removeBook } = useDeck()
  const [error, setError] = useState<string | null>(null)
  const inDeck = deck.books.includes(bookId)

  function change(action: (folder: string) => Promise<void>) {
    setError(null)
    action(bookId).catch(() => setError('Не удалось сохранить — попробуй ещё раз'))
  }

  return (
    <div className="mt-4">
      {inDeck ? (
        <>
          <Link to={`/study/${bookId}`} className="btn-primary w-full px-3">
            <Icon name="cards" size={16} />
            Повторить
          </Link>
          <p className="mt-2 flex items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-success">
              <Icon name="check" size={13} />
              В колоде
            </span>
            <span aria-hidden="true" className="text-line-strong">
              ·
            </span>
            <button
              type="button"
              onClick={() => change(removeBook)}
              className="text-ink-faint underline decoration-line underline-offset-2 transition-colors hover:text-ink"
            >
              Убрать
            </button>
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => change(addBook)}
            disabled={!ready}
            className="btn-primary w-full px-3"
          >
            <Icon name="cards" size={16} />
            В колоду
          </button>
          <p className="mt-2 text-center text-xs text-ink-faint">
            {count} {plural(count, 'карточка', 'карточки', 'карточек')}
            {user ? ' · бот напомнит о повторении' : ''}
          </p>
        </>
      )}
      {error ? <p className="mt-2 text-center text-xs text-danger">{error}</p> : null}
    </div>
  )
}

export default AddBookToDeck
