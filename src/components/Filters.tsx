import Icon from './Icon'

// Единый фильтр для всех списков приложения. Раньше каждое измерение было
// рядом чипов: три измерения = три ряда цветных «таблеток», которые перебивали
// сам список. Здесь одно измерение — один компактный список, вся строка держится
// в одну-две строки на телефоне и не спорит с контентом за внимание.
//
// Список нативный (`<select>`): на телефоне открывается системный пикер, работает
// с клавиатуры и со скринридером, и не растёт в высоту от числа вариантов.

/** Значение «ничего не выбрано» — одинаковое во всех фильтрах. */
export const ALL = 'all'

export interface FilterOption {
  value: string
  label: string
}

export function FilterBar({
  children,
  onReset,
}: {
  children: React.ReactNode
  /** Задан — показываем «Сбросить»; передавать только когда фильтры активны. */
  onReset?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="px-1 text-xs font-medium text-ink-faint transition-colors duration-200 hover:text-accent"
        >
          Сбросить
        </button>
      ) : null}
    </div>
  )
}

export function FilterSelect<T extends string>({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  /** Название измерения — подпись для скринридера («Год», «Книга»). */
  label: string
  /** Как называется «всё»: «Все книги», «Все годы». */
  allLabel: string
  value: T | typeof ALL
  options: FilterOption[]
  onChange: (value: T | typeof ALL) => void
}) {
  // Один вариант выбирать не из чего — фильтр не показываем вовсе.
  if (options.length < 2) return null

  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T | typeof ALL)}
        className={`filter-select ${value === ALL ? '' : 'filter-select-on'}`}
      >
        <option value={ALL}>{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
      />
    </div>
  )
}
