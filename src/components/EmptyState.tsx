interface EmptyStateProps {
  title: string
  hint?: string
}

// Пустое состояние списка.
function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="rounded-card border border-dashed border-line-strong py-10 text-center">
      <p className="font-medium text-ink">{title}</p>
      {hint ? <p className="mt-1 text-sm text-ink-faint">{hint}</p> : null}
    </div>
  )
}

export default EmptyState
