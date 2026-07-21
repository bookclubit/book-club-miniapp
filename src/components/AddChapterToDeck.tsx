import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addChapterToDeck,
  isBookInDeck,
  isChapterInDeck,
  removeChapterFromDeck,
} from '../lib/deck'
import Icon from './Icon'

// Кнопка «в колоду» для страницы главы: добавляет к изучению карточки ТОЛЬКО этой
// главы. Если книга уже подписана целиком — глава и так покрыта.
function AddChapterToDeck({
  bookId,
  order,
  count,
}: {
  bookId: string
  order: number
  count: number
}) {
  const bookInDeck = isBookInDeck(bookId)
  const [inDeck, setInDeck] = useState(() => isChapterInDeck(bookId, order))

  if (bookInDeck) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link to={`/study/${bookId}`} className="btn-primary">
          <Icon name="cards" size={16} />
          Повторить карточки
        </Link>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
          <Icon name="check" size={15} />
          Вся книга в колоде
        </span>
      </div>
    )
  }

  if (inDeck) {
    return (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link to={`/study/${bookId}`} className="btn-primary">
          <Icon name="cards" size={16} />
          Повторить карточки
        </Link>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
          <Icon name="check" size={15} />
          Глава в колоде
        </span>
        <button
          type="button"
          onClick={() => {
            removeChapterFromDeck(bookId, order)
            setInDeck(false)
          }}
          className="text-sm text-ink-faint underline decoration-line underline-offset-2 hover:text-ink"
        >
          Убрать
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        addChapterToDeck(bookId, order)
        setInDeck(true)
      }}
      className="btn-primary mt-6"
    >
      <Icon name="cards" size={16} />
      Добавить карточки главы
      <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs">{count}</span>
    </button>
  )
}

export default AddChapterToDeck
