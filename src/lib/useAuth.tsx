import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { mutate } from 'swr'
import {
  authTelegram,
  clearToken,
  fetchMe,
  getToken,
  telegramInitData,
  telegramWebApp,
  type PlatformUser,
} from './account'
import { syncGuestData } from './sync'

interface AuthState {
  user: PlatformUser | null
  loading: boolean
  inTelegram: boolean
  // Вход через бота завершён: сессию уже сохранил checkBotLogin.
  completeLogin: (user: PlatformUser) => void
  logout: () => void
}

// Кэши SWR, которые после переноса гостевых данных в аккаунт пора перечитать.
const ACCOUNT_KEYS = /^(deck|server-progress|stats|study-books)/

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Внутри Telegram сообщаем клиенту, что приложение готово, и разворачиваем.
    telegramWebApp()?.ready()
    telegramWebApp()?.expand()

    let cancelled = false
    ;(async () => {
      try {
        // 1) Есть сохранённая сессия — проверяем её.
        if (getToken()) {
          try {
            const me = await fetchMe()
            if (!cancelled) setUser(me)
            return
          } catch {
            clearToken()
          }
        }
        // 2) Открыто внутри Telegram — вход автоматически по initData.
        const initData = telegramInitData()
        if (initData) {
          const u = await authTelegram(initData)
          if (!cancelled) setUser(u)
        }
      } catch {
        clearToken()
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Вошёл — переносим в аккаунт то, что человек успел на этом устройстве как гость.
  const userId = user?.id
  useEffect(() => {
    if (userId === undefined) return
    syncGuestData(userId)
      .then((synced) => {
        if (synced) void mutate((key) => typeof key === 'string' && ACCOUNT_KEYS.test(key))
      })
      .catch(() => {
        // Сервер недоступен — перенесём при следующем запуске.
      })
  }, [userId])

  const completeLogin = useCallback((u: PlatformUser) => setUser(u), [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, loading, inTelegram: Boolean(telegramInitData()), completeLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth вне AuthProvider')
  return ctx
}
