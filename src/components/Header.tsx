import { Link } from 'react-router-dom'

// Шапка приложения со ссылкой на главную.
function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span>📚</span>
          <span>Книжный клуб</span>
        </Link>
        <span className="text-sm text-muted">для фронтендеров</span>
      </div>
    </header>
  )
}

export default Header
