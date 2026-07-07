interface LoadingProps {
  label?: string
}

// Индикатор загрузки данных.
function Loading({ label = 'Загрузка…' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted">
      <span className="animate-spin text-xl">⏳</span>
      <span>{label}</span>
    </div>
  )
}

export default Loading
