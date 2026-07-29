import { useTopicRatings } from '../lib/ratings'

// Залитые глифы «палец вверх/вниз» — в одном стиле с иконками материалов рядом.
const THUMB_UP =
  'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73V10z'
const THUMB_DOWN =
  'M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v1c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z'

function Thumb({ down = false }: { down?: boolean }) {
  return (
    <svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
      <path d={down ? THUMB_DOWN : THUMB_UP} />
    </svg>
  )
}

/**
 * Оценка темы: «полезно» / «не очень» в один тап.
 *
 * Почему не десятибалльная шкала: оценок на тему десятки, и средний балл по
 * такой выборке — шум, а десять целей на мобильном экране мало кто нажмёт.
 * Бинарный голос даёт честный рейтинг (нижняя граница Уилсона на стороне бота)
 * и не превращает отзыв в публичную отметку коллеге.
 *
 * Число показываем только у «полезно»: сколько людей поставили «не очень» —
 * не публичная информация, но на рейтинг эти голоса влияют.
 */
function TopicVote({ topicId }: { topicId: string }) {
  const { ratingFor, myVote, canVote, vote } = useTopicRatings()
  const rating = ratingFor(topicId)
  const mine = myVote(topicId)

  const hint = canVote ? null : 'Оценивать можно после входа через Telegram'

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        disabled={!canVote}
        aria-pressed={mine === 1}
        aria-label="Полезно"
        title={hint ?? (mine === 1 ? 'Убрать оценку' : 'Полезно')}
        onClick={() => vote(topicId, 1)}
        className={`icon-link w-auto gap-1 px-2 disabled:cursor-default disabled:opacity-60 ${
          mine === 1 ? 'text-accent' : ''
        }`}
      >
        <Thumb />
        {rating.up > 0 ? (
          <span className="text-xs font-semibold tabular-nums">{rating.up}</span>
        ) : null}
      </button>
      <button
        type="button"
        disabled={!canVote}
        aria-pressed={mine === -1}
        aria-label="Не очень"
        title={hint ?? (mine === -1 ? 'Убрать оценку' : 'Не очень')}
        onClick={() => vote(topicId, -1)}
        className={`icon-link disabled:cursor-default disabled:opacity-60 ${
          mine === -1 ? 'text-accent' : ''
        }`}
      >
        <Thumb down />
      </button>
    </div>
  )
}

export default TopicVote
