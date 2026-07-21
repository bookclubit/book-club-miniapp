import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addBookToDeck, isBookInDeck, removeBookFromDeck } from '../lib/deck'
import Icon from './Icon'

// Кнопка «в колоду» для страницы книги: добавляет ВСЕ карточки книги к изучению
// (подписка на книгу — новые карточки подгрузятся сами). Когда книга уже в
// колоде — ведёт к повторению и позволяет убрать.
function AddBookToDeck({ bookId, count }: { bookId: string; count: number }) {
  const [inDeck, setInDeck] = useState(() => isBookInDeck(bookId))

  if (inDeck) {
    return (
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link to={`/study/${bookId}`} className="btn-primary">
          <Icon name="cards" size={16} />
          Повторить карточки
        </Link>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
          <Icon name="check" size={15} />
          В колоде
        </span>
        <button
          type="button"
          onClick={() => {
            removeBookFromDeck(bookId)
            setInDeck(false)
          }}
          className="text-sm text-ink-faint underline decoration-line underline-offset-2 hover:text-ink"
        >
          Убрать из колоды
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        addBookToDeck(bookId)
        setInDeck(true)
      }}
      className="btn-primary mt-5"
    >
      <Icon name="cards" size={16} />
      Добавить в колоду
      <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs">{count}</span>
    </button>
  )
}

export default AddBookToDeck
