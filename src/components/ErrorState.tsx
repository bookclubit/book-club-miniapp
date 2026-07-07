interface ErrorStateProps {
  message?: string
}

// Состояние ошибки загрузки.
function ErrorState({ message = 'Что-то пошло не так при загрузке данных.' }: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mb-3 text-4xl">⚠️</div>
      <p className="font-semibold text-slate-900">Ошибка</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
    </div>
  )
}

export default ErrorState
