import { NavLink } from 'react-router-dom'
import Icon, { type IconName } from './Icon'

const TABS: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/', label: 'Главная', icon: 'home', end: true },
  { to: '/books', label: 'Книги', icon: 'book' },
  { to: '/meetings', label: 'Встречи', icon: 'calendar' },
  { to: '/speakers', label: 'Спикеры', icon: 'users' },
  { to: '/study', label: 'Карточки', icon: 'cards' },
]

// Нижняя таб-панель — только на мобильных (десктоп навигируется меню в шапке).
// Даёт приложению «нативный» вид: фиксированный бар с иконками и подписями.
function BottomNav() {
  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-200',
                isActive ? 'text-accent' : 'text-ink-faint',
              ].join(' ')
            }
          >
            <Icon name={icon} size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
