interface PillProps {
  active: boolean
  onClick: () => void
  /** md — обычная «таблетка» (вкладки, фильтры), sm — компактный чип. */
  size?: 'sm' | 'md'
  disabled?: boolean
  /** Подсказка при наведении — для сокращённых подписей («JS» → «JavaScript»). */
  title?: string
  children: React.ReactNode
}

// Единая «таблетка»-переключатель для вкладок, фильтров-чипов и выбора значений.
// Активная — акцентная заливка, неактивная — контурная с подсветкой по hover.
function Pill({ active, onClick, size = 'md', disabled, title, children }: PillProps) {
  const sizing = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      className={`shrink-0 whitespace-nowrap rounded-full font-medium disabled:opacity-60 ${sizing} ${
        active
          ? 'bg-accent text-on-accent'
          : 'border border-line bg-surface text-ink-faint transition-colors duration-200 hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

export default Pill
