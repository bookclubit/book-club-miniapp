import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addBookToDeck, isBookInDeck, removeBookFromDeck } from '../lib/deck'
import { plural } from '../lib/format'
import Icon from './Icon'

/**
 * Кнопка «в колоду» на странице книги: подписывает на ВСЕ карточки книги
 * (новые подгрузятся сами). Когда книга уже в колоде — ведёт к повторению
 * и позволяет отписаться.
 *
 * Стоит под обложкой, поэтому по ширине колонки: короткая подпись на кнопке,
 * число карточек и статус — мелкой строкой под ней.
 */
function AddBookToDeck({ bookId, count }: { bookId: string; count: number }) {
  const [inDeck, setInDeck] = useState(() => isBookInDeck(bookId))

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
              onClick={() => {
                removeBookFromDeck(bookId)
                setInDeck(false)
              }}
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
            onClick={() => {
              addBookToDeck(bookId)
              setInDeck(true)
            }}
            className="btn-primary w-full px-3"
          >
            <Icon name="cards" size={16} />
            В колоду
          </button>
          <p className="mt-2 text-center text-xs text-ink-faint">
            {count} {plural(count, 'карточка', 'карточки', 'карточек')}
          </p>
        </>
      )}
    </div>
  )
}

export default AddBookToDeck
