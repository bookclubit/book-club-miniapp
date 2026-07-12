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
