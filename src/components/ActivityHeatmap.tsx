import { plural } from '../lib/format'
import type { UserStats } from '../types'

// Насыщенность клетки — доля от самого активного дня, четыре ступени.
const LEVELS = ['bg-line', 'bg-accent/25', 'bg-accent/50', 'bg-accent/75', 'bg-accent']

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function dayLabel(date: string, count: number): string {
  const day = Number(date.slice(8, 10))
  const month = MONTHS[Number(date.slice(5, 7)) - 1] ?? ''
  const reviews = count === 0 ? 'без повторений' : `${count} ${plural(count, 'повторение', 'повторения', 'повторений')}`
  return `${day} ${month}: ${reviews}`
}

// Понедельник — 0: строки календаря — дни недели, как в привычном календаре.
function weekdayOf(date: string): number {
  return (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7
}

/**
 * Календарь повторений за 12 недель: столбец — неделя, строка — день недели.
 * Дни считает бот по Москве — тот же календарь, что у серии в /status.
 */
function ActivityHeatmap({ activity }: { activity: UserStats['activity'] }) {
  const max = Math.max(1, ...activity.map((d) => d.count))
  const total = activity.reduce((n, d) => n + d.count, 0)
  // Пустые клетки в начале, чтобы первый день встал в строку своего дня недели.
  const pad = activity.length > 0 ? weekdayOf(activity[0].date) : 0

  // Ширина ограничена: во всю карточку клетки выходили крупнее, чем нужно
  // для «пятнистой» картинки, а на телефоне и так займут всю ширину.
  return (
    <div className="max-w-sm">
      <div
        role="img"
        aria-label={`Повторения за 12 недель: ${total}`}
        className="grid grid-flow-col grid-rows-7 auto-cols-fr gap-1"
      >
        {Array.from({ length: pad }, (_, i) => (
          <span key={`pad-${i}`} aria-hidden="true" />
        ))}
        {activity.map(({ date, count }) => (
          <span
            key={date}
            title={dayLabel(date, count)}
            aria-hidden="true"
            className={`aspect-square rounded-sm ${LEVELS[count === 0 ? 0 : Math.ceil((count / max) * 4)]}`}
          />
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex items-center justify-end gap-1 text-xs text-ink-faint">
        <span className="mr-1">меньше</span>
        {LEVELS.map((level) => (
          <span key={level} className={`h-2.5 w-2.5 rounded-sm ${level}`} />
        ))}
        <span className="ml-1">больше</span>
      </div>
    </div>
  )
}

export default ActivityHeatmap
