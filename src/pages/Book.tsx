import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import useSWR from 'swr'
import AddBookToDeck from '../components/AddBookToDeck'
import ChapterTopics from '../components/ChapterTopics'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import Pill from '../components/Pill'
import {
  fetchBooks,
  fetchChapters,
  fetchFlashcards,
  fetchIndex,
  mediaUrl,
  readingProgress,
} from '../lib/api'
import type { BookWithFolder } from '../lib/api'
import { authorKey } from '../lib/authors'
import { plural } from '../lib/format'
import type { ChapterWithSlug, ContentIndex, Flashcard } from '../types'

// Страница книги: обложка с кнопкой колоды, авторы, описание и все главы
// с темами на этой же странице (отдельных страниц у глав нет).
function Book() {
  const { bookId } = useParams<{ bookId: string }>()
  const { hash } = useLocation()
  // Фильтр по главе: 'all' или slug главы.
  const [only, setOnly] = useState('all')

  // Единый кэш книг с Home/Books: мета не грузится второй раз по своему ключу.
  const books = useSWR<BookWithFolder[]>('books', fetchBooks)
  const chapters = useSWR<ChapterWithSlug[]>(
    bookId ? `chapters:${bookId}` : null,
    () => fetchChapters(bookId as string),
  )
  const cards = useSWR<Flashcard[]>(
    bookId ? `flashcards:${bookId}` : null,
    () => fetchFlashcards(bookId as string),
  )
  // Реестр нужен темам: по нему находятся аватарки спикеров и их страницы.
  useSWR<ContentIndex>('index', fetchIndex)

  // Ссылки на главу и тему — якоря этой страницы (#slug, #topicId). Прокрутить
  // можно только когда главы уже в DOM, а рисуются они после загрузки И мет,
  // И глав: пока грузится хоть что-то, на месте списка заглушка.
  const ready = Boolean(books.data && chapters.data)
  useEffect(() => {
    if (!hash || !ready) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash, ready])

  if (!bookId) return <ErrorState message="Не указана книга." />

  const meta = books.data?.find((b) => b.folder === bookId)?.meta
  const isLoading = books.isLoading || chapters.isLoading
  const error = books.error || chapters.error
  const cardCount = cards.data?.length ?? 0
  // Разобранная глава — та, у которой есть темы (пустые заготовки не в счёт):
  // так же считает прогресс в readingProgress, цифры не должны расходиться.
  const done = (chapters.data ?? []).filter((c) => c.topics.length > 0).length
  const progress = meta ? readingProgress(bookId, meta.total_chapters) : 0

  const shown = chapters.data ?? []
  // Выбранная глава могла пропасть (перешли на другую книгу) — тогда снова все.
  const picked = shown.filter((c) => c.slug === only)
  const visible = only === 'all' || picked.length === 0 ? shown : picked

  // Страница-«чтение»: узкая колонка, в широкой строка темы растягивается,
  // а название и материалы разъезжаются по краям.
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/" className="link-back">
        <Icon name="arrow-left" size={15} />
        Ко всем книгам
      </Link>

      {isLoading ? (
        <Loading label="Загружаем книгу…" />
      ) : error ? (
        <div className="mt-6">
          <ErrorState message={(error as Error).message} />
        </div>
      ) : (
        <>
          {meta ? (
            <header className="reveal mt-8 flex flex-col gap-8 sm:flex-row sm:gap-10">
              {/* Обложка и под ней — кнопка колоды (по ширине обложки). */}
              <div className="w-44 shrink-0 self-start">
                {meta.cover ? (
                  <img
                    src={mediaUrl(meta.cover)}
                    alt={`Обложка книги «${meta.title}»`}
                    width={176}
                    height={250}
                    className="h-62.5 w-44 rounded-lg object-cover shadow-lift"
                  />
                ) : null}
                {cardCount > 0 ? <AddBookToDeck bookId={bookId} count={cardCount} /> : null}
              </div>

              <div className="min-w-0">
                <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
                  {meta.title}
                </h1>
                {meta.title_original ? (
                  <p className="font-display mt-1 text-base italic text-ink-faint">
                    {meta.title_original}
                    {meta.edition ? ` · ${meta.edition}-е издание` : ''}
                  </p>
                ) : null}

                {/* Автор — ссылка на его страницу: у одного человека может быть
                    несколько книг клуба. */}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  {meta.authors.map((author) => (
                    <Link
                      key={author.name}
                      to={`/author/${authorKey(author)}`}
                      className="group flex items-center gap-2"
                    >
                      {author.avatar ? (
                        <img
                          src={mediaUrl(author.avatar)}
                          alt=""
                          width={28}
                          height={28}
                          loading="lazy"
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : null}
                      <span className="text-sm font-medium text-ink-soft transition-colors duration-200 group-hover:text-accent">
                        {author.name}
                      </span>
                    </Link>
                  ))}
                </div>

                <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
                  {meta.description}
                </p>

                <div className="mt-5 max-w-md">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-faint">
                      Разобрано {done} из {meta.total_chapters}{' '}
                      {plural(meta.total_chapters, 'главы', 'глав', 'глав')}
                    </span>
                    <span className="font-semibold text-ink">{progress}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Прогресс чтения"
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
                  >
                    <div
                      className="progress-fill h-full rounded-full bg-accent"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </header>
          ) : null}

          <section
            className="reveal mt-14"
            style={{ '--reveal-delay': '140ms' } as React.CSSProperties}
          >
            {/* Глав бывает больше десятка: вместо прокрутки — фильтр по главе.
                «Все главы» — состояние по умолчанию. */}
            {shown.length > 3 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Pill size="sm" active={only === 'all'} onClick={() => setOnly('all')}>
                  Все главы
                </Pill>
                {shown.map((chapter) => (
                  <Pill
                    key={chapter.slug}
                    size="sm"
                    active={only === chapter.slug}
                    onClick={() => setOnly(chapter.slug)}
                  >
                    {chapter.order}
                  </Pill>
                ))}
              </div>
            ) : null}

            <div className="mt-10">
              {visible.length === 0 ? (
                <EmptyState
                  title="Главы пока не добавлены"
                  hint="Материалы появятся по мере разбора книги."
                />
              ) : (
                <div className="space-y-14">
                  {visible.map((chapter, i) => (
                    <ChapterTopics key={chapter.slug} chapter={chapter} delay={i * 60} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Book
