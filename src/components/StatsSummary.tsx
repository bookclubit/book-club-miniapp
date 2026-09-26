import { plural } from '../lib/format'
import type { UserStats } from '../types'

/**
 * Главные цифры изучения: серия дней, к повторению, выучено и доля
 * вспомненного. Считает бот — те же цифры в его /status.
 */
function StatsSummary({ stats }: { stats: UserStats }) {
  const { streak, totals, reviews } = stats
  const tiles = [
    {
      value: String(streak.current),
      label: `${plural(streak.current, 'день', 'дня', 'дней')} подряд`,
      hint: streak.best > streak.current ? `рекорд — ${streak.best}` : null,
    },
    { value: String(totals.due), label: 'к повторению', hint: null, accent: totals.due > 0 },
    { value: `${totals.mature}`, label: `выучено из ${totals.cards}`, hint: null },
    {
      value: reviews.accuracy === null ? '—' : `${Math.round(reviews.accuracy * 100)}%`,
      label: 'вспоминаешь',
      hint:
        reviews.week > 0
          ? `${reviews.week} ${plural(reviews.week, 'повторение', 'повторения', 'повторений')} за неделю`
          : null,
    },
  ]

  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {tiles.map((tile) => (
        // В разметке подпись (dt) идёт первой, на экране число — сверху.
        <div key={tile.label} className="flex flex-col">
          <dt className="order-2 mt-0.5 text-xs text-ink-faint">{tile.label}</dt>
          <dd
            className={`order-1 font-display text-3xl font-semibold ${tile.accent ? 'text-accent' : 'text-ink'}`}
          >
            {tile.value}
          </dd>
          {tile.hint ? <dd className="order-3 mt-0.5 text-xs text-ink-faint">{tile.hint}</dd> : null}
        </div>
      ))}
    </dl>
  )
}

export default StatsSummary
