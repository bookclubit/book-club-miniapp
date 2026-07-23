// Аккаунт платформы: вход через Telegram и клиент к API бота (единый прогресс,
// настройки). Сессия — подписанный токен из /api/auth/telegram в localStorage.

import { BOT_API } from './api'
import type { ReviewGrade, StudyProgress } from '../types'

export interface PlatformUser {
  id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  photo_url: string | null
}

// Прогресс карточки с сервера. cardId — композитный «<book>:<cardId>».
export interface ServerCardProgress {
  cardId: string
  repetition: number
  interval: number
  easiness: number
  dueDate: number
  lastReviewed: number
}

// Данные от Telegram Login Widget (браузер).
export type TelegramWidgetUser = Record<string, string>

// --- Telegram WebApp (Mini App внутри Telegram) ---

interface TelegramWebApp {
  initData: string
  ready: () => void
  expand: () => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
    onTelegramAuth?: (user: TelegramWidgetUser) => void
  }
}

export function telegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp
}

// initData присутствует только когда приложение открыто внутри Telegram.
export function telegramInitData(): string | null {
  const data = telegramWebApp()?.initData
  return data && data.length > 0 ? data : null
}

// --- Сессия ---

const TOKEN_KEY = 'bc-session'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage недоступен — сессия проживёт только текущую страницу.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // игнорируем
  }
}

// --- Клиент API ---

async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) }
  if (token) headers.authorization = `Bearer ${token}`
  if (init.body) headers['content-type'] = 'application/json'

  const res = await fetch(`${BOT_API}${path}`, { ...init, headers })
  if (res.status === 401) {
    clearToken()
    throw new Error('Нужен вход')
  }
  if (!res.ok) {
    throw new Error(`Ошибка запроса (${res.status})`)
  }
  return (await res.json()) as T
}

/** Вход через Telegram (initData внутри Telegram или данные Login Widget). */
export async function authTelegram(payload: {
  initData?: string
  widget?: TelegramWidgetUser
}): Promise<PlatformUser> {
  const res = await fetch(`${BOT_API}/api/auth/telegram`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Не удалось войти через Telegram')
  const data = (await res.json()) as { token: string; user: PlatformUser }
  setToken(data.token)
  return data.user
}

export async function fetchMe(): Promise<PlatformUser> {
  const data = await authFetch<{ user: PlatformUser }>('/api/me')
  return data.user
}

export async function fetchServerProgress(): Promise<ServerCardProgress[]> {
  const data = await authFetch<{ progress: ServerCardProgress[] }>('/api/progress')
  return data.progress
}

/**
 * Оценка карточки на сервере: POST /api/review { card_id, book_id, grade }.
 * Сервер сам считает SM-2 и возвращает новый прогресс карточки.
 */
export async function sendCardReview(
  bookId: string,
  cardId: string,
  grade: ReviewGrade,
): Promise<ServerCardProgress> {
  const data = await authFetch<{ progress: ServerCardProgress }>('/api/review', {
    method: 'POST',
    body: JSON.stringify({ card_id: cardId, book_id: bookId, grade }),
  })
  return data.progress
}

/** Серверная запись прогресса → локальный формат карточки (Study). */
export function serverToCardProgress(p: ServerCardProgress) {
  return {
    repetitions: p.repetition,
    interval: p.interval,
    easiness: p.easiness,
    dueDate: new Date(p.dueDate).toISOString(),
  }
}

/**
 * Серверный прогресс (ключи «<book>:<cardId>») → локальный прогресс книги
 * (ключи — id карточек без префикса), как его хранит и читает Study.
 */
export function serverToStudyProgress(
  list: ServerCardProgress[],
  bookId: string,
): StudyProgress {
  const prefix = `${bookId}:`
  const progress: StudyProgress = {}
  for (const p of list) {
    if (!p.cardId.startsWith(prefix)) continue
    progress[p.cardId.slice(prefix.length)] = serverToCardProgress(p)
  }
  return progress
}

export async function fetchUserSettings(): Promise<{ daily_cards: number; options: number[] }> {
  return authFetch('/api/settings')
}

export async function saveUserSettings(daily: number): Promise<{ daily_cards: number }> {
  return authFetch('/api/settings', {
    method: 'POST',
    body: JSON.stringify({ daily_cards: daily }),
  })
}
