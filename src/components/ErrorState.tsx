interface ErrorStateProps {
  message?: string
}

// Состояние ошибки загрузки данных.
function ErrorState({ message = 'Что-то пошло не так.' }: ErrorStateProps) {
  return (
    <div className="rounded-card border border-danger/25 bg-danger-soft px-5 py-6 text-center">
      <p className="font-semibold text-danger">Не удалось загрузить данные</p>
      <p className="mt-1 text-sm text-ink-soft">{message}</p>
    </div>
  )
}

export default ErrorState
