import { useState } from 'react'
import useSWR from 'swr'
import BrandIcon from '../components/BrandIcon'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import TelegramLoginButton from '../components/TelegramLoginButton'
import { fetchPlanSlots, speakerUrl, type PlanSlot } from '../lib/api'
import { applyMembership, claimTopic, fetchMembership, type Membership } from '../lib/account'
import { formatEventDate, formatWeekday } from '../lib/format'
import { useAuth } from '../lib/useAuth'

// «Стать спикером» целиком в приложении: заявка на участие для новых людей и
// выбор свободной темы — для участников клуба. Перекидывать в бота не нужно,
// хотя те же шаги есть и там (/speaker) — состояние общее, оно в D1.
function BecomeSpeaker() {
  const { user, loading, inTelegram, loginWithWidget } = useAuth()
  const {
    data: membership,
    error,
    isLoading,
    mutate,
  } = useSWR<Membership>(user ? 'membership' : null, fetchMembership)

  if (loading || (user && isLoading)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Loading label="Проверяем участие…" />
      </div>
    )
  }

  if (!user) return <LoginView inTelegram={inTelegram} onWidget={loginWithWidget} />

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <div className="flex items-center gap-2 text-accent">
          <Icon name="mic" size={20} />
          <span className="text-xs font-semibold uppercase tracking-widest">Доклады клуба</span>
        </div>
        <h1 className="font-display mt-2 text-3xl font-semibold text-ink sm:text-4xl">
          Стать спикером
        </h1>
      </header>

      {error ? (
        <div className="mt-8">
          <ErrorState message={(error as Error).message} />
        </div>
      ) : membership?.registered ? (
        <TopicPicker name={membership.full_name} />
      ) : membership?.status === 'pending' ? (
        <PendingCard about={membership.about} onEdit={() => void mutate({ ...membership, status: 'none' }, { revalidate: false })} />
      ) : (
        <ApplyForm
          declined={membership?.status === 'declined'}
          noUsername={!user.username}
          defaultName={
            membership?.full_name ?? [user.first_name, user.last_name].filter(Boolean).join(' ')
          }
          defaultAbout={membership?.about ?? ''}
          onSent={() => void mutate()}
        />
      )}

      {/* Те же шаги есть в боте — состояние общее, продолжить можно где удобно. */}
      <p className="reveal mt-8 text-xs text-ink-faint" style={{ '--reveal-delay': '200ms' } as React.CSSProperties}>
        Удобнее в переписке?{' '}
        <a
          href={speakerUrl()}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-ink-soft underline decoration-line-strong underline-offset-2 transition-colors hover:text-accent"
        >
          то же самое в боте
        </a>{' '}
        — команда /speaker.
      </p>
    </div>
  )
}

// --- Не вошёл ---

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
      <h1 className="font-display mt-5 text-2xl font-semibold text-ink">Стать спикером</h1>
      <p className="mx-auto mt-2 max-w-sm text-ink-soft">
        Войди через Telegram — по нему клуб узнаёт спикеров, а бот пишет, когда заявку
        одобрят.
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

// --- Заявка на участие (новый человек) ---

function ApplyForm({
  declined,
  noUsername,
  defaultName,
  defaultAbout,
  onSent,
}: {
  declined: boolean
  // Профиль спикера в каталоге клуба заводится по @username.
  noUsername: boolean
  defaultName: string
  defaultAbout: string
  onSent: () => void
}) {
  const [name, setName] = useState(defaultName)
  const [about, setAbout] = useState(defaultAbout)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      await applyMembership(name.trim(), about.trim())
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить заявку')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="reveal mt-8" style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-ink">
          {declined ? 'Отправить заявку заново' : 'Заявка на участие'}
        </h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {declined
            ? 'Прошлую заявку не одобрили — расскажи о себе подробнее, и админ посмотрит ещё раз.'
            : 'Темы докладов берут участники клуба. Расскажи о себе — админ посмотрит заявку и откроет доступ к темам. Приходить на встречи можно и без заявки.'}
        </p>

        {noUsername ? (
          <p className="mt-4 rounded-card bg-warn-soft p-3 text-sm text-warn">
            У тебя не задан @username в Telegram — задай его в настройках, иначе клуб не сможет
            оформить профиль спикера.
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink">Имя и фамилия</span>
            <span className="mt-0.5 block text-xs text-ink-faint">
              Так тебя объявят в программе встречи.
            </span>
            <input
              className="field mt-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Петров"
              maxLength={80}
              required
              disabled={sending}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-ink">О себе</span>
            <span className="mt-0.5 block text-xs text-ink-faint">
              Чем занимаешься, какой опыт и о чём хотел бы рассказать клубу.
            </span>
            <textarea
              className="field mt-2 min-h-32"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Фронтендер в … , пять лет с React. Хочу разобрать главу про…"
              minLength={10}
              maxLength={2000}
              required
              disabled={sending}
            />
          </label>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button type="submit" className="btn-primary" disabled={sending}>
            <Icon name="send" size={16} />
            {sending ? 'Отправляем…' : 'Отправить заявку'}
          </button>
        </form>
      </div>
    </section>
  )
}

// --- Заявка на модерации ---

function PendingCard({ about, onEdit }: { about: string | null; onEdit: () => void }) {
  return (
    <section className="reveal mt-8" style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
      <div className="card">
        <div className="flex items-center gap-2 text-accent">
          <Icon name="check" size={18} />
          <h2 className="font-display text-lg font-semibold text-ink">Заявка у админа</h2>
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">
          Как только её одобрят, бот напишет — и здесь появятся свободные темы.
        </p>
        {about ? (
          <p className="mt-4 whitespace-pre-line rounded-card bg-canvas p-4 text-sm text-ink-soft">
            {about}
          </p>
        ) : null}
        <button type="button" onClick={onEdit} className="btn-ghost mt-5 text-sm">
          Дополнить заявку
        </button>
      </div>
    </section>
  )
}

// --- Участник клуба: выбор свободной темы ---

// Слоты по эфирам, порядок эфиров сохраняется (список уже отсортирован по дате).
function groupByEvent(slots: PlanSlot[]): Array<[string, PlanSlot[]]> {
  const groups = new Map<string, PlanSlot[]>()
  for (const slot of slots) {
    const group = groups.get(slot.eventId) ?? []
    group.push(slot)
    groups.set(slot.eventId, group)
  }
  return [...groups.entries()]
}

function TopicPicker({ name }: { name: string | null }) {
  const { data: slots, error, isLoading, mutate } = useSWR<PlanSlot[]>('plan-slots', fetchPlanSlots)
  const [busy, setBusy] = useState<string | null>(null)
  const [taken, setTaken] = useState<PlanSlot | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  async function take(slot: PlanSlot) {
    setBusy(slot.topicId)
    setFailure(null)
    try {
      await claimTopic(slot.topicId)
      setTaken(slot)
      // Тема ушла из свободных — и в общем списке занятости тоже.
      await mutate()
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Не удалось взять тему')
      await mutate()
    } finally {
      setBusy(null)
    }
  }

  if (taken) {
    return (
      <section className="reveal mt-8">
        <div className="card">
          <div className="flex items-center gap-2 text-accent">
            <Icon name="check" size={18} />
            <h2 className="font-display text-lg font-semibold text-ink">Тема твоя 🎉</h2>
          </div>
          <p className="mt-1.5 text-ink-soft">
            «{taken.title}» — {formatEventDate(taken.date)}, {taken.time} МСК.
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            Заявка ушла админу. Когда её подтвердят, бот пришлёт шаблон презентации и
            инструкцию — собирать слайды с нуля не придётся.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="reveal mt-8" style={{ '--reveal-delay': '60ms' } as React.CSSProperties}>
      <p className="text-ink-soft">
        {name ? `${name}, ты` : 'Ты'} участник клуба — выбирай свободную тему из плана.
        Презентацию клуб соберёт из шаблона, останется наполнить слайды.
      </p>

      {failure ? <p className="mt-4 text-sm text-danger">{failure}</p> : null}

      <div className="mt-6">
        {isLoading ? (
          <Loading label="Загружаем план…" />
        ) : error ? (
          <ErrorState message={(error as Error).message} />
        ) : !slots || slots.length === 0 ? (
          <EmptyState
            title="Свободных тем нет"
            hint="Все темы ближайших эфиров уже разобрали. Как только появится новый эфир, темы придут сюда."
          />
        ) : (
          // Группируем по эфиру: дата и книга — в подзаголовке, а не в каждой строке.
          <div className="space-y-8">
            {groupByEvent(slots).map(([eventId, group]) => (
              <section key={eventId}>
                <h2 className="font-display text-lg font-semibold text-ink">
                  {group[0].stream ? `Книжный клуб ${group[0].stream}` : group[0].eventTitle}
                </h2>
                <p className="mt-0.5 text-xs text-ink-faint">
                  {formatEventDate(group[0].date)}, {formatWeekday(group[0].date)} · {group[0].time}{' '}
                  МСК
                  {group[0].bookTitle ? ` · ${group[0].bookTitle}` : ''}
                </p>
                <ul className="mt-3 space-y-2">
                  {group.map((slot) => (
                    <li
                      key={slot.topicId}
                      className="card flex flex-wrap items-center gap-3 p-4"
                    >
                      <p className="min-w-0 grow text-sm font-medium text-ink">{slot.title}</p>
                      <button
                        type="button"
                        onClick={() => void take(slot)}
                        // Ghost, а не акцент: на экране пять кнопок, основной CTA один.
                        className="btn-ghost ml-auto shrink-0 px-4 py-2 text-xs"
                        disabled={busy !== null}
                      >
                        {busy === slot.topicId ? 'Берём…' : 'Взять тему'}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default BecomeSpeaker
