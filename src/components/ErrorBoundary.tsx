import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import Icon from './Icon'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

// Граница ошибок рендера: вместо белого экрана — аккуратное сообщение
// в стиле дизайн-системы и кнопка перезагрузки страницы.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // В консоль — для диагностики; пользователю показываем спокойный экран.
    console.error('Ошибка рендера:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon name="refresh" size={26} />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold text-ink">
          Что-то пошло не так
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-soft">
          Страница не смогла отрисоваться. Попробуй обновить — обычно это помогает.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary mt-6"
        >
          <Icon name="refresh" size={15} />
          Обновить страницу
        </button>
      </div>
    )
  }
}

export default ErrorBoundary
