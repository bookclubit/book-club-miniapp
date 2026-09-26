// Аккаунт платформы: вход через Telegram и клиент к API бота (единый прогресс,
// колода, статистика). Сессия — подписанный токен бота в localStorage.
//
// Вход: внутри Telegram — автоматически по initData Mini App; в браузере —
// через бота (кнопка ведёт в t.me/<бот>?start=login_<code>, человек жмёт
// «Войти», сайт забирает сессию). Telegram Login Widget не используем: он
// подтверждает вход сообщением от Telegram по номеру телефона, и в России
// оно не доходит.

import { BOT_API, BOT_URL } from './api'
import type { Deck, ReviewGrade, StudyProgress, UserStats } from '../types'

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

// --- Telegram WebApp (Mini App внутри Telegram) ---

interface TelegramWebApp {
  initData: string
  ready: () => void
  expand: () => void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
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
    // Сообщение сервера точнее кода: «тему только что заняли», «нужна заявка».
    const message = await res
      .json()
      .then((d) => (d as { error?: string }).error)
      .catch(() => null)
    throw new Error(message ?? `Ошибка запроса (${res.status})`)
  }
  return (await res.json()) as T
}

/** Вход внутри Telegram: initData Mini App подписан токеном бота. */
export async function authTelegram(initData: string): Promise<PlatformUser> {
  const res = await fetch(`${BOT_API}/api/auth/telegram`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ initData }),
  })
  if (!res.ok) throw new Error('Не удалось войти через Telegram')
  const data = (await res.json()) as { token: string; user: PlatformUser }
  setToken(data.token)
  return data.user
}

// --- Вход в браузере через бота ---

// code уходит в диплинк бота, secret остаётся здесь: сессию бот отдаст только
// тому, кто знает secret, — ссылку из чата чужим браузером не использовать.
export interface BotLoginRequest {
  code: string
  secret: string
}

export type BotLoginCheck =
  | { status: 'pending' }
  | { status: 'expired' }
  | { status: 'ok'; user: PlatformUser }

export async function startBotLogin(): Promise<BotLoginRequest> {
  const res = await fetch(`${BOT_API}/api/auth/bot`, { method: 'POST' })
  if (!res.ok) throw new Error('Не удалось начать вход')
  return (await res.json()) as BotLoginRequest
}

/** Ссылка, по которой человек подтверждает вход в боте. */
export function botLoginUrl(code: string): string {
  return `${BOT_URL}?start=login_${code}`
}

/** Подтвердил ли человек вход в боте. При успехе сессия сохраняется сразу. */
export async function checkBotLogin(request: BotLoginRequest): Promise<BotLoginCheck> {
  const res = await fetch(`${BOT_API}/api/auth/bot/check`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  })
  // 410 — заявка устарела или уже использована, 403 — не наш secret: начинаем заново.
  if (res.status === 410 || res.status === 403) return { status: 'expired' }
  if (!res.ok) throw new Error(`Ошибка входа (${res.status})`)
  const data = (await res.json()) as { status: 'pending' | 'ok'; token?: string; user?: PlatformUser }
  if (data.status === 'ok' && data.token && data.user) {
    setToken(data.token)
    return { status: 'ok', user: data.user }
  }
  return { status: 'pending' }
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

// --- Участие в клубе: заявка и брони тем ---

// Темы докладов берут участники клуба. Пока registered = false, слоты закрыты:
// новый человек отправляет заявку с рассказом о себе, решение принимает админ.
export interface Membership {
  registered: boolean
  status: 'none' | 'pending' | 'approved' | 'declined'
  full_name: string | null
  about: string | null
  speaker: { id: string; name: string } | null
}

export async function fetchMembership(): Promise<Membership> {
  return authFetch('/api/membership')
}

/** Заявка на участие: имя для программы + рассказ о себе (его увидит админ). */
export async function applyMembership(
  fullName: string,
  about: string,
): Promise<{ registered: boolean; status: Membership['status'] }> {
  return authFetch('/api/membership', {
    method: 'POST',
    body: JSON.stringify({ full_name: fullName, about }),
  })
}

/** Взять тему доклада: бот проверит участие и план, заявка уйдёт админу. */
export async function claimTopic(topicId: string): Promise<{ topic_title: string }> {
  return authFetch('/api/claim', {
    method: 'POST',
    body: JSON.stringify({ topic_id: topicId }),
  })
}

// --- Колода, импорт прогресса, статистика ---

export async function fetchServerDeck(): Promise<Deck> {
  const data = await authFetch<{ deck: Deck }>('/api/deck')
  return data.deck
}

/** Книга в колоду или из неё; сервер отвечает колодой после изменения. */
export async function changeServerDeck(action: 'add' | 'remove', book: string): Promise<Deck> {
  const data = await authFetch<{ deck: Deck }>('/api/deck', {
    method: 'POST',
    body: JSON.stringify({ action, book }),
  })
  return data.deck
}

/** Колода с устройства — в аккаунт (только добавляет). */
export async function mergeServerDeck(deck: Deck): Promise<Deck> {
  const data = await authFetch<{ deck: Deck }>('/api/deck', {
    method: 'POST',
    body: JSON.stringify({ action: 'merge', ...deck }),
  })
  return data.deck
}

// Прогресс карточки с устройства в формате сервера.
export interface ImportedProgress {
  book_id: string
  card_id: string
  repetition: number
  interval: number
  easiness: number
  due_date: number
  last_reviewed: number
}

/** Прогресс с устройства — в аккаунт. Сервер не трогает карточки, которые уже знает. */
export async function importProgress(items: ImportedProgress[]): Promise<number> {
  const data = await authFetch<{ imported: number }>('/api/progress/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
  return data.imported
}

/** Статистика изучения — та же, что /status в боте. */
export async function fetchStats(): Promise<UserStats> {
  const data = await authFetch<{ stats: UserStats }>('/api/stats')
  return data.stats
}

