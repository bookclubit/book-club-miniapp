import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Book from './pages/Book'
import Books from './pages/Books'
import Chapter from './pages/Chapter'
import Home from './pages/Home'
import Meetings from './pages/Meetings'
import Speaker from './pages/Speaker'
import Speakers from './pages/Speakers'
import Study from './pages/Study'
import StudyIndex from './pages/StudyIndex'

// Прокрутка к началу при смене маршрута.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Смена ключа по маршруту перезапускает анимации появления страницы.
function AnimatedRoutes() {
  const { pathname } = useLocation()
  return (
    <main key={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/meetings" element={<Meetings />} />
        <Route path="/speakers" element={<Speakers />} />
        <Route path="/speaker/:id" element={<Speaker />} />
        <Route path="/book/:bookId" element={<Book />} />
        <Route path="/book/:bookId/chapter/:chapterId" element={<Chapter />} />
        <Route path="/study" element={<StudyIndex />} />
        <Route path="/study/:bookId" element={<Study />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </main>
  )
}

// Корневой компонент: шапка + маршрутизация.
function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <AnimatedRoutes />
      <footer className="mx-auto max-w-5xl px-4 pb-10 pt-16 sm:px-6">
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
    </BrowserRouter>
  )
}

export default App
