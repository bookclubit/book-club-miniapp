import { Link } from 'react-router-dom'
import useSWR from 'swr'
import ActivityHeatmap from '../components/ActivityHeatmap'
import BookMastery from '../components/BookMastery'
import BrandIcon from '../components/BrandIcon'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import StatsSummary from '../components/StatsSummary'
import TelegramBotLogin from '../components/TelegramBotLogin'
import { BOT_URL, fetchBooks, type BookWithFolder } from '../lib/api'
import { fetchStats } from '../lib/account'
import { MASTERY_PARTS } from '../lib/mastery'
import { useAuth } from '../lib/useAuth'
import type { UserStats } from '../types'

// Профиль: кто вошёл, статистика изучения и напоминания бота.
function Account() {
  const { user, loading, inTelegram, completeLogin, logout } = useAuth()

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Loading label="Загружаем аккаунт…" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
          <BrandIcon brand="telegram" size={28} />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold text-ink">Аккаунт клуба</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">
          Войди через Telegram — колода, прогресс и статистика станут общими для сайта
          и приложения в Telegram, а бот будет напоминать о повторении.
        </p>
        <div className="mt-6">
          {inTelegram ? (
            <p className="text-sm text-ink-faint">Входим автоматически…</p>
          ) : (
            <TelegramBotLogin onLogin={completeLogin} />
          )}
        </div>
      </div>
    )
  }

  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Участник клуба'

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="reveal flex items-center gap-4">
        {user.photo_url ? (
          <img
            src={user.photo_url}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-line"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-faint">
            <Icon name="users" size={28} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold text-ink">{name}</h1>
          {user.username ? <p className="text-sm text-ink-faint">@{user.username}</p> : null}
        </div>
      </header>

      <StudyStats userId={user.id} />
      <RemindersCard />

      <button type="button" onClick={logout} className="btn-ghost mt-8 text-sm">
        <Icon name="arrow-left" size={15} />
        Выйти
      </button>
    </div>
  )
}

// --- Статистика изучения (считает бот: те же цифры в его /status) ---

function StudyStats({ userId }: { userId: number }) {
  const { data, error, isLoading } = useSWR<UserStats>(`stats:${userId}`, fetchStats)
  // Обложки — из меты книг, ключ общий с каталогом.
  const books = useSWR<BookWithFolder[]>('books', fetchBooks)
  const coverOf = (folder: string) => books.data?.find((b) => b.folder === folder)?.meta.cover

  if (isLoading) {
    return (
      <section className="mt-8">
        <Loading label="Считаем статистику…" />
      </section>
    )
  }
  if (error || !data) {
    return (
      <section className="mt-8">
        <ErrorState message={error ? (error as Error).message : 'Статистика недоступна'} />
      </section>
    )
  }
  if (data.books.length === 0 && data.reviews.total === 0) {
    return (
      <section className="reveal mt-8" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
        <EmptyState
          title="Статистика появится после первых повторений"
          hint="Добавь книгу в колоду и повтори её карточки — здесь будет видно, как она выучена."
          action={
            <Link to="/books" className="btn-ghost">
              <Icon name="book" size={16} />
              К книгам
            </Link>
          }
        />
      </section>
    )
  }

  return (
    <>
      <section className="reveal mt-8" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
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
            <h2 className="font-display text-lg font-semibold text-ink">Книги</h2>
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
  )
}

// --- Напоминания: живут в боте ---

function RemindersCard() {
  return (
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
  )
}

export default Account
