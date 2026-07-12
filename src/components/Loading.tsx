interface LoadingProps {
  label?: string
}

// Индикатор загрузки: пульсирующие плейсхолдеры вместо спиннера.
function Loading({ label = 'Загружаем…' }: LoadingProps) {
  return (
    <div role="status" aria-live="polite" className="py-6">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-3">
        <div className="h-5 w-2/5 animate-pulse rounded-md bg-line" />
        <div className="h-4 w-4/5 animate-pulse rounded-md bg-line [animation-delay:120ms]" />
        <div className="h-4 w-3/5 animate-pulse rounded-md bg-line [animation-delay:240ms]" />
      </div>
    </div>
  )
}

export default Loading
