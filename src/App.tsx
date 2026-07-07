import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Book from './pages/Book'
import Chapter from './pages/Chapter'
import Home from './pages/Home'
import Study from './pages/Study'

// Корневой компонент: шапка + маршрутизация.
function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:bookId" element={<Book />} />
          <Route path="/book/:bookId/chapter/:chapterId" element={<Chapter />} />
          <Route path="/study/:bookId" element={<Study />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
