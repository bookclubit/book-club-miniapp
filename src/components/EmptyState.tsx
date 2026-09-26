interface EmptyStateProps {
  title: string
  hint?: string
  // Что сделать дальше — ссылка или кнопка под подсказкой.
  action?: React.ReactNode
}

// Пустое состояние списка.
function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-line-strong px-4 py-10 text-center">
      <p className="font-medium text-ink">{title}</p>
      {hint ? <p className="mx-auto mt-1 max-w-md text-sm text-ink-faint">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export default EmptyState
