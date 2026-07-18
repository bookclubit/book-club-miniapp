import { useEffect, useState } from 'react'
import useSWR from 'swr'
import BrandIcon from '../components/BrandIcon'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import TelegramLoginButton from '../components/TelegramLoginButton'
import { fetchBooks, fetchFlashcards } from '../lib/api'
import {
  fetchServerProgress,
  fetchUserSettings,
  saveUserSettings,
  type ServerCardProgress,
} from '../lib/account'
import { useAuth } from '../lib/useAuth'

// Все ключи карточек клуба в формате «<book>:<cardId>» (как хранит прогресс).
async function fetchAllCardKeys(): Promise<string[]> {
  const books = await fetchBooks()
  const per = await Promise.all(
    books.map(async ({ folder }) => {
      const cards = await fetchFlashcards(folder)
      return cards.map((c) => `${folder}:${c.id}`)
    }),
  )
  return per.flat()
}

interface Stats {
  total: number
  started: number
  fresh: number
  due: number
  scheduled: number
}

function computeStats(keys: string[], progress: ServerCardProgress[]): Stats {
  const now = Date.now()
  const byId = new Map(progress.map((p) => [p.cardId, p]))
  let started = 0
  let overdue = 0
  for (const key of keys) {
    const p = byId.get(key)
    if (!p) continue
    started++
    if (p.dueDate <= now) overdue++
  }
  const total = keys.length
  const fresh = total - started
  return { total, started, fresh, due: overdue + fresh, scheduled: started - overdue }
}

function Account() {
  const { user, loading, inTelegram, loginWithWidget, logout } = useAuth()

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Loading label="Загружаем аккаунт…" />
      </div>
    )
  }

  if (!user) return <LoginView inTelegram={inTelegram} onWidget={loginWithWidget} />

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

      <StatsCard userId={user.id} />
      <SettingsCard />

      <button
        type="button"
        onClick={logout}
        className="btn-ghost mt-8 text-sm"
      >
        <Icon name="arrow-left" size={15} />
        Выйти
      </button>
    </div>
  )
}

// --- Не вошёл: приглашение войти через Telegram ---

function LoginView({
  inTelegram,
  onWidget,
}: {
  inTelegram: boolean
  onWidget: (data: Record<string, string>) => Promise<void>
}) {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
        <BrandIcon brand="telegram" size={28} />
      </span>
      <h1 className="font-display mt-5 text-2xl font-semibold text-ink">Аккаунт клуба</h1>
      <p className="mx-auto mt-2 max-w-sm text-ink-soft">
        Войди через Telegram — и прогресс карточек станет единым с ботом: учишь здесь
        или отвечаешь боту, статистика одна.
      </p>

      <div className="mt-6 flex justify-center">
        {inTelegram ? (
          <p className="text-sm text-ink-faint">Входим автоматически…</p>
        ) : (
          <TelegramLoginButton
            onAuth={(data) => {
              setError(null)
              onWidget(data).catch(() => setError('Не удалось войти. Попробуй ещё раз.'))
            }}
          />
        )}
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
    </div>
  )
}

// --- Статистика ---

function StatsCard({ userId }: { userId: number }) {
  const { data, error, isLoading } = useSWR(`account-stats:${userId}`, async () => {
    const [keys, progress] = await Promise.all([fetchAllCardKeys(), fetchServerProgress()])
    return computeStats(keys, progress)
  })

  return (
    <section className="reveal mt-8" style={{ '--reveal-delay': '80ms' } as React.CSSProperties}>
      <h2 className="font-display text-lg font-semibold text-ink">Статистика карточек</h2>
      <div className="mt-3 card">
        {isLoading ? (
          <Loading label="Считаем прогресс…" />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : data ? (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Всего" value={data.total} />
            <Stat label="В работе" value={data.started} />
            <Stat label="Новых" value={data.fresh} />
            <Stat label="Ждут повторения" value={data.due} accent />
            <Stat label="На потом" value={data.scheduled} />
          </dl>
        ) : null}
      </div>
    </section>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <dd className={`font-display text-2xl font-semibold ${accent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </dd>
      <dt className="mt-0.5 text-xs text-ink-faint">{label}</dt>
    </div>
  )
}

// --- Настройки ---

function SettingsCard() {
  const [daily, setDaily] = useState<number | null>(null)
  const [options, setOptions] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUserSettings()
      .then((s) => {
        setDaily(s.daily_cards)
        setOptions(s.options)
      })
      .catch(() => setError('Не удалось загрузить настройки'))
  }, [])

  async function choose(n: number) {
    if (n === daily || saving) return
    setSaving(true)
    setError(null)
    const prev = daily
    setDaily(n)
    try {
      await saveUserSettings(n)
    } catch {
      setDaily(prev)
      setError('Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="reveal mt-8" style={{ '--reveal-delay': '160ms' } as React.CSSProperties}>
      <h2 className="font-display text-lg font-semibold text-ink">Настройки</h2>
      <div className="mt-3 card">
        <p className="text-sm font-medium text-ink">Карточек в день</p>
        <p className="mt-0.5 text-sm text-ink-faint">
          Сколько карточек присылает бот и берётся в сессию повторения.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => choose(n)}
              aria-pressed={n === daily}
              disabled={saving}
              className={
                n === daily
                  ? 'rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-on-accent'
                  : 'rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-ink-faint transition-colors duration-200 hover:text-ink'
              }
            >
              {n}
            </button>
          ))}
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </div>
    </section>
  )
}

export default Account
