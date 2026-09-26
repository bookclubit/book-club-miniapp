import { useCallback, useEffect, useRef, useState } from 'react'
import {
  botLoginUrl,
  checkBotLogin,
  startBotLogin,
  type BotLoginRequest,
  type PlatformUser,
} from '../lib/account'
import BrandIcon from './BrandIcon'

// Сколько ждём подтверждения в боте — как живёт заявка на сервере.
const WAIT_MS = 10 * 60 * 1000
const POLL_MS = 2000

/**
 * Вход в браузере через бота клуба. Ссылка на бота готовится заранее: клик
 * по обычной ссылке надёжнее всего открывает приложение Telegram на телефоне.
 * Дальше человек жмёт «Войти» в боте, а страница забирает сессию — опросом
 * и сразу при возвращении на вкладку.
 */
function TelegramBotLogin({ onLogin }: { onLogin: (user: PlatformUser) => void }) {
  const [request, setRequest] = useState<BotLoginRequest | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const startedAt = useRef(0)

  const prepare = useCallback(async () => {
    setError(null)
    try {
      setRequest(await startBotLogin())
      startedAt.current = Date.now()
    } catch {
      setError('Не получилось связаться с ботом. Проверь интернет и попробуй ещё раз.')
    }
  }, [])

  useEffect(() => {
    void prepare()
  }, [prepare])

  // Ждём подтверждения: опрос и проверка при возвращении из Telegram.
  useEffect(() => {
    if (!waiting || !request) return
    let cancelled = false
    let busy = false

    async function check() {
      if (busy || cancelled || !request) return
      busy = true
      try {
        const result = await checkBotLogin(request)
        if (cancelled) return
        if (result.status === 'ok') {
          onLogin(result.user)
        } else if (result.status === 'expired' || Date.now() - startedAt.current > WAIT_MS) {
          setWaiting(false)
          setNote('Ссылка для входа устарела — нажми кнопку ещё раз.')
          void prepare()
        }
      } catch {
        // Сеть моргнула — следующая проверка через пару секунд.
      } finally {
        busy = false
      }
    }

    const timer = window.setInterval(() => void check(), POLL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [waiting, request, onLogin, prepare])

  if (error) {
    return (
      <div className="text-center">
        <p className="text-sm text-danger">{error}</p>
        <button type="button" onClick={() => void prepare()} className="btn-ghost mt-3">
          Попробовать ещё раз
        </button>
      </div>
    )
  }

  if (!request) {
    return (
      <button type="button" disabled className="btn-primary">
        <BrandIcon brand="telegram" size={18} />
        Готовим вход…
      </button>
    )
  }

  const href = botLoginUrl(request.code)

  if (waiting) {
    return (
      <div role="status" aria-live="polite" className="text-center">
        <p className="flex items-center justify-center gap-2 font-medium text-ink">
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          Ждём подтверждения в Telegram…
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-ink-faint">
          Нажми в боте «Старт», а затем «Войти» — вход завершится здесь сам.
        </p>
        <a href={href} target="_blank" rel="noopener noreferrer" className="link-inline mt-3 inline-block text-sm">
          Открыть бота ещё раз
        </a>
      </div>
    )
  }

  return (
    <div className="text-center">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          setNote(null)
          setWaiting(true)
        }}
        className="btn-primary"
      >
        <BrandIcon brand="telegram" size={18} />
        Войти через Telegram
      </a>
      <p className="mx-auto mt-3 max-w-xs text-xs text-ink-faint">
        {note ?? 'Откроется бот клуба: нажми «Старт», а затем «Войти». Номер телефона не нужен.'}
      </p>
    </div>
  )
}

export default TelegramBotLogin
