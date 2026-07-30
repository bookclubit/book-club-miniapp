import { useTopicRatings } from '../lib/ratings'

// Залитые стрелки — в одном стиле с иконками материалов рядом.
const ARROW_UP = 'M12 4l8 8h-5v8H9v-8H4z'
const ARROW_DOWN = 'M12 20l8-8h-5V4H9v8H4z'

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg aria-hidden="true" width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d={down ? ARROW_DOWN : ARROW_UP} />
    </svg>
  )
}

/**
 * Оценка темы: стрелка вверх, баланс голосов, стрелка вниз столбиком —
 * как на Reddit. Столбик стоит у левого края строки: у всех тем страницы одна
 * линия стрелок, глазу не нужно ходить к правому краю и обратно.
 *
 * Почему не десятибалльная шкала: оценок на тему десятки, и средний балл по
 * такой выборке — шум, а десять целей на мобильном экране мало кто нажмёт.
 * Бинарный голос даёт честный рейтинг (нижняя граница Уилсона на стороне бота).
 *
 * В середине — баланс (`полезно` минус `не очень`), поэтому он может быть
 * отрицательным. На порядок в «Топе» баланс не влияет: там рейтинг Уилсона,
 * так что один минус не роняет тему вниз.
 */
function TopicVote({ topicId }: { topicId: string }) {
  const { ratingFor, myVote, canVote, vote } = useTopicRatings()
  const rating = ratingFor(topicId)
  const mine = myVote(topicId)
  const balance = rating.up - rating.down

  const hint = canVote ? null : 'Оценивать можно после входа через Telegram'
  // Плоские кнопки вместо квадратов icon-link: столбик стоит в строке темы,
  // и высоту строки должен задавать текст, а не оценка.
  const button = 'icon-link h-4 w-8 disabled:cursor-default disabled:opacity-60'

  return (
    <div className="flex shrink-0 flex-col items-center">
      <button
        type="button"
        disabled={!canVote}
        aria-pressed={mine === 1}
        aria-label="Полезно"
        title={hint ?? (mine === 1 ? 'Убрать оценку' : 'Полезно')}
        onClick={() => vote(topicId, 1)}
        className={`${button} ${mine === 1 ? 'text-accent' : ''}`}
      >
        <Arrow />
      </button>

      <span
        aria-label={`Баланс оценок: ${balance}`}
        className={`py-0.5 text-center text-sm font-semibold leading-none tabular-nums ${
          mine === 0 ? 'text-ink-soft' : 'text-accent'
        }`}
      >
        {balance}
      </span>

      <button
        type="button"
        disabled={!canVote}
        aria-pressed={mine === -1}
        aria-label="Не очень"
        title={hint ?? (mine === -1 ? 'Убрать оценку' : 'Не очень')}
        onClick={() => vote(topicId, -1)}
        className={`${button} ${mine === -1 ? 'text-accent' : ''}`}
      >
        <Arrow down />
      </button>
    </div>
  )
}

export default TopicVote
