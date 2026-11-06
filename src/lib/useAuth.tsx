import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  authTelegram,
  clearToken,
  fetchMe,
  getToken,
  telegramInitData,
  telegramWebApp,
  type PlatformUser,
} from './account'

interface AuthState {
  user: PlatformUser | null
  loading: boolean
  inTelegram: boolean
  // Вход через бота завершён: сессию уже сохранил checkBotLogin.
  completeLogin: (user: PlatformUser) => void
  logout: () => void
}

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
