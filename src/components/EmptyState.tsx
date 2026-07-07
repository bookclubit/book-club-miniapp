interface EmptyStateProps {
  icon?: string
  title: string
  hint?: string
}

// Пустое состояние (нет данных для отображения).
function EmptyState({ icon = '🗂️', title, hint }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="font-semibold text-slate-900">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  )
}

export default EmptyState
