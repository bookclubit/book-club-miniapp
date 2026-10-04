import useSWR from 'swr'
import { BOT_URL, fetchBooks, type BookWithFolder } from '../lib/api'
import { fetchStats } from '../lib/account'
import { MASTERY_PARTS } from '../lib/mastery'
import type { UserStats } from '../types'
import ActivityHeatmap from './ActivityHeatmap'
import BookMastery from './BookMastery'
import BrandIcon from './BrandIcon'
import ErrorState from './ErrorState'
import Loading from './Loading'
import StatsSummary from './StatsSummary'

/**
 * Статистика изучения на вкладке «Карточки»: сводка, календарь активности,
 * освоение по книгам и напоминания бота. Считает бот — те же цифры в его
 * /status. Пока повторений не было, цифр нет: о пустой колоде страница
 * уже сказала сама.
 */
function StudyStats({ userId }: { userId: number }) {
  const { data, error, isLoading } = useSWR<UserStats>(`stats:${userId}`, fetchStats)
  // Обложки — из меты книг, ключ общий с каталогом.
  const books = useSWR<BookWithFolder[]>('books', fetchBooks)
  const coverOf = (folder: string) => books.data?.find((b) => b.folder === folder)?.meta.cover

  if (isLoading) {
    return (
      <section className="mt-10">
        <Loading label="Считаем статистику…" />
      </section>
    )
  }
  if (error || !data) {
    return (
      <section className="mt-10">
        <ErrorState message={error ? (error as Error).message : 'Статистика недоступна'} />
      </section>
    )
  }

  const empty = data.books.length === 0 && data.reviews.total === 0

  return (
    <>
      {empty ? null : (
        <>
          <section className="reveal mt-10" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
            <h2 className="font-display text-lg font-semibold text-ink">Статистика</h2>
            <div className="card mt-3">
              <StatsSummary stats={data} />
            </div>
          </section>

          <section className="reveal mt-8" style={{ '--reveal-delay': '140ms' } as React.CSSProperties}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">Активность</h2>
              <span className="text-xs text-ink-faint">12 недель</span>
            </div>
            <div className="card mt-3">
              <ActivityHeatmap activity={data.activity} />
            </div>
          </section>

          {data.books.length > 0 ? (
            <section className="reveal mt-8" style={{ '--reveal-delay': '200ms' } as React.CSSProperties}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-lg font-semibold text-ink">Освоение по книгам</h2>
                <ul aria-hidden="true" className="flex gap-3 text-xs text-ink-faint">
                  {MASTERY_PARTS.map(({ label, className }) => (
                    <li key={label} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${className}`} />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 space-y-3">
                {data.books.map((book) => (
                  <BookMastery key={book.folder} book={book} cover={coverOf(book.folder)} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {/* Напоминания живут в боте. */}
      <section className="reveal mt-8" style={{ '--reveal-delay': '260ms' } as React.CSSProperties}>
        <h2 className="font-display text-lg font-semibold text-ink">Напоминания</h2>
        <div className="card mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-ink-soft">
            Бот клуба пишет в 10:00 МСК, когда в колоде есть карточки к повторению.
            Выключить — /stop, включить снова — /start.
          </p>
          <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost shrink-0">
            <BrandIcon brand="telegram" size={16} />
            Открыть бота
          </a>
        </div>
      </section>
    </>
  )
}

export default StudyStats
