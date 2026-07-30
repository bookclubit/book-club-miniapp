export interface TabItem {
  id: string
  label: string
  /** Число рядом с названием — сколько всего в разделе. */
  count?: number
}

/**
 * Вкладки с подчёркиванием активной. Не «таблетки»: вкладка переключает раздел
 * страницы (План / Архив), а `Pill` — фильтр внутри раздела; разный смысл
 * должен выглядеть по-разному.
 */
function Tabs({
  items,
  active,
  onChange,
  label,
}: {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 border-b border-line">
      {items.map((item) => {
        const on = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(item.id)}
            className={`-mb-px flex items-center gap-2 border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
              on
                ? 'border-accent text-ink'
                : 'border-transparent text-ink-faint hover:text-ink'
            }`}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span
                className={`text-xs font-medium tabular-nums ${
                  on ? 'text-accent' : 'text-ink-faint'
                }`}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
