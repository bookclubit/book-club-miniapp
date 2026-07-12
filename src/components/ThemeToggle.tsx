import { useEffect, useState } from 'react'
import Icon from './Icon'

type Theme = 'light' | 'dark'

// Текущая тема из DOM (инит-скрипт в index.html ставит data-theme до отрисовки).
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

// Кнопка переключения светлой/тёмной темы; выбор хранится в localStorage.
function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.dataset.theme = 'dark'
    } else {
      delete document.documentElement.dataset.theme
    }
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // localStorage недоступен — тема просто не сохранится
    }
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className="flex h-9 w-9 items-center justify-center rounded-btn border border-line bg-surface text-ink-soft transition-colors duration-200 hover:border-line-strong hover:text-accent"
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={17} />
    </button>
  )
}

export default ThemeToggle
