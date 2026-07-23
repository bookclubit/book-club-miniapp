import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import Header from './components/Header'
import Loading from './components/Loading'
import { AuthProvider } from './lib/useAuth'

// Страницы грузятся лениво (code-splitting): каждая — отдельный чанк.
const Account = lazy(() => import('./pages/Account'))
const Book = lazy(() => import('./pages/Book'))
const Books = lazy(() => import('./pages/Books'))
const Chapter = lazy(() => import('./pages/Chapter'))
const Home = lazy(() => import('./pages/Home'))
const Meetings = lazy(() => import('./pages/Meetings'))
const Speaker = lazy(() => import('./pages/Speaker'))
const Speakers = lazy(() => import('./pages/Speakers'))
const Study = lazy(() => import('./pages/Study'))
const StudyIndex = lazy(() => import('./pages/StudyIndex'))

// Прокрутка к началу при смене маршрута.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Смена ключа по маршруту перезапускает анимации появления страницы
// (и заодно сбрасывает границу ошибок при переходе на другую страницу).
function AnimatedRoutes() {
  const { pathname } = useLocation()
  return (
    <main key={pathname}>
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
              <Loading label="Загружаем страницу…" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<Books />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/speakers" element={<Speakers />} />
            <Route path="/speaker/:id" element={<Speaker />} />
            <Route path="/account" element={<Account />} />
            <Route path="/book/:bookId" element={<Book />} />
            <Route path="/book/:bookId/chapter/:chapterId" element={<Chapter />} />
            <Route path="/study" element={<StudyIndex />} />
            <Route path="/study/:bookId" element={<Study />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </main>
  )
}

// Корневой компонент: шапка + маршрутизация.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Header />
        <AnimatedRoutes />
        <footer className="mx-auto max-w-5xl px-4 pb-28 pt-16 sm:px-6 sm:pb-10">
        <p className="border-t border-line pt-5 text-xs text-ink-faint">
          Данные клуба открыты на{' '}
          <a
            href="https://github.com/bookclubit/book-club-data"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-ink-soft underline decoration-line-strong underline-offset-2 transition-colors hover:text-accent"
          >
            GitHub
          </a>
        </p>
        </footer>
        <BottomNav />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
