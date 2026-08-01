import { useEffect, useMemo, useState } from 'react'
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
  bookFolderById,
  fetchBooks,
  fetchChapters,
  fetchEvents,
  fetchFlashcards,
  fetchIndex,
  mediaUrl,
} from '../lib/api'
import type { BookWithFolder } from '../lib/api'
import { authorKey } from '../lib/authors'
import type { ChapterWithSlug, ClubEvent, ContentIndex, Flashcard } from '../types'

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
  // Встречи — ради досок обсуждений: доска задаётся у встречи по главе.
  // Ключ общий с главной и встречами, поэтому обычно берётся из кэша.
  const events = useSWR<ClubEvent[]>('events', fetchEvents)

  // Ссылки на главу и тему — якоря этой страницы (#slug, #topicId). Прокрутить
  // можно только когда главы уже в DOM, а рисуются они после загрузки И мет,
  // И глав: пока грузится хоть что-то, на месте списка заглушка.
  const ready = Boolean(books.data && chapters.data)
  useEffect(() => {
    if (!hash || !ready) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash, ready])

  // Доски по главам: slug главы → ссылка. Доска живёт во встрече (её задают
  // при создании обсуждения), а нужна рядом с главой. Книга во встрече указана
  // как id из meta, в маршруте — папкой, поэтому сверяем через bookFolderById.
  // Встречи отсортированы по дате, так что при нескольких обсуждениях главы
  // остаётся доска последнего.
  const boards = useMemo(() => {
    const found: Record<string, string> = {}
    for (const event of events.data ?? []) {
      if (event.type !== 'closed-chapter' || !event.notes_board_url) continue
      if (bookFolderById(event.book_id) !== bookId) continue
      found[event.chapter] = event.notes_board_url
    }
    return found
  }, [events.data, bookId])

  if (!bookId) return <ErrorState message="Не указана книга." />

  const meta = books.data?.find((b) => b.folder === bookId)?.meta
  const isLoading = books.isLoading || chapters.isLoading
  const error = books.error || chapters.error
  const cardCount = cards.data?.length ?? 0

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
                    <ChapterTopics
                      key={chapter.slug}
                      chapter={chapter}
                      delay={i * 60}
                      board={boards[chapter.slug]}
                    />
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
