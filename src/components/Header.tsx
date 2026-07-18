import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'
import Icon from './Icon'
import ThemeToggle from './ThemeToggle'

const NAV = [
  { to: '/', label: 'Главная', end: true },
  { to: '/books', label: 'Книги', end: false },
  { to: '/meetings', label: 'Встречи', end: false },
  { to: '/speakers', label: 'Спикеры', end: false },
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

// Шапка: словесный знак, вкладки разделов (десктоп) и переключатель темы.
// На мобильных навигация вынесена в нижнюю таб-панель (BottomNav).
function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center gap-x-6 px-4 py-3 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-ink"
        >
          {/* logo-white.png — чёрный знак (светлая тема), logo-black.png — белый (тёмная) */}
          <img src="/logo-white.png" alt="" width="28" height="28" className="logo-mark-light h-7 w-7" />
          <img src="/logo-black.png" alt="" width="28" height="28" className="logo-mark-dark h-7 w-7" />
          Книжный клуб
        </Link>

        <nav
          aria-label="Основная навигация"
          className="hidden flex-1 gap-5 sm:flex"
        >
          {NAV.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3 sm:ml-0">
          <AccountLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

// Вход в аккаунт: аватар, если вошёл, иначе иконка пользователя.
function AccountLink() {
  const { user } = useAuth()
  return (
    <NavLink
      to="/account"
      aria-label="Аккаунт"
      className={({ isActive }) =>
        `flex h-8 w-8 items-center justify-center rounded-full transition ${
          isActive ? 'ring-2 ring-accent' : ''
        }`
      }
    >
      {user?.photo_url ? (
        <img src={user.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink-faint">
          <Icon name="users" size={17} />
        </span>
      )}
    </NavLink>
  )
}

export default Header
