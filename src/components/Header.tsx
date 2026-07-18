import { Link, NavLink } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { to: '/', label: 'Главная', end: true },
  { to: '/books', label: 'Книги', end: false },
  { to: '/meetings', label: 'Встречи', end: false },
  { to: '/study', label: 'Карточки', end: false },
]

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'border-b-2 pb-0.5 text-sm font-medium transition-colors duration-200',
    isActive
      ? 'border-accent text-ink'
      : 'border-transparent text-ink-faint hover:text-ink',
  ].join(' ')
}

// Шапка: словесный знак, вкладки разделов и переключатель темы.
function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-ink"
        >
          {/* logo-white.png — чёрный знак (светлая тема), logo-black.png — белый (тёмная) */}
          <img src="/logo-white.png" alt="" width="28" height="28" className="logo-mark-light h-7 w-7" />
          <img src="/logo-black.png" alt="" width="28" height="28" className="logo-mark-dark h-7 w-7" />
          Книжный клуб
        </Link>

        <nav aria-label="Основная навигация" className="order-3 flex w-full gap-5 sm:order-0 sm:w-auto sm:flex-1">
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <span className="ml-auto sm:ml-0">
          <ThemeToggle />
        </span>
      </div>
    </header>
  )
}

export default Header
