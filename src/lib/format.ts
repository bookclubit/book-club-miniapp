// Утилиты форматирования текста и дат (ru-RU).

// Русская плюрализация: 1 тема, 2 темы, 5 тем.
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

// «20 июля» из даты YYYY-MM-DD.
export function formatEventDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

// «10 июля 2026» из даты YYYY-MM-DD. Без «г.»: в строке доклада место дорого,
// а год и так очевиден.
export function formatDateWithYear(date: string): string {
  return new Date(`${date}T00:00:00`)
    .toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(' г.', '')
}

// День недели: «воскресенье».
export function formatWeekday(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', { weekday: 'long' })
}

// Событие уже прошло (сравнение по дате, без времени)?
export function isPast(date: string): boolean {
  const today = new Date()
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return date < iso
}

// Начало встречи как абсолютный момент: дата+время в данных — МСК (UTC+3),
// поэтому сравнение корректно в любом часовом поясе зрителя. Время может быть
// не указано или битым — тогда момента нет.
function startedAt(date: string, time?: string): number | null {
  if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return null
  const start = new Date(`${date}T${time.padStart(5, '0')}:00+03:00`)
  return Number.isNaN(start.getTime()) ? null : start.getTime()
}

// Встреча уже началась?
export function hasStarted(date: string, time?: string): boolean {
  const start = startedAt(date, time)
  if (start === null) return isPast(date)
  return Date.now() >= start
}

/**
 * Сколько часов после начала встреча считается идущей. Времени окончания
 * в данных нет, а созвон клуба редко тянется дольше.
 */
export const EVENT_HOURS = 4

// Встреча закончилась: прошло EVENT_HOURS с начала. Без времени начала
// (или с битым) — по дате, то есть на следующий день.
export function hasEnded(date: string, time?: string): boolean {
  const start = startedAt(date, time)
  if (start === null) return isPast(date)
  return Date.now() >= start + EVENT_HOURS * 60 * 60 * 1000
}
