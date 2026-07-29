import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import LearningOutcome from '../components/LearningOutcome'
import AddChapterToDeck from '../components/AddChapterToDeck'
import TopicRow from '../components/TopicRow'
import { chapterUrl, fetchFlashcards, fetchIndex, fetcher } from '../lib/api'
import type { Chapter as ChapterData, ContentIndex, Flashcard } from '../types'

// Страница главы: описание, ожидаемый результат и темы (Markdown-материалы).
function Chapter() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>()

  const chapter = useSWR<ChapterData>(
    bookId && chapterId ? chapterUrl(bookId, chapterId) : null,
    fetcher,
  )
  const cards = useSWR<Flashcard[]>(
    bookId ? `flashcards:${bookId}` : null,
    () => fetchFlashcards(bookId as string),
  )
  // Реестр нужен темам: по нему находятся аватарки спикеров и их страницы.
  // На прямом заходе в главу (диплинк) его иначе никто не загрузит.
  useSWR<ContentIndex>('index', fetchIndex)

  if (!bookId || !chapterId) return <ErrorState message="Не указана глава." />

  // Карточки именно этой главы (в карточках chapter = номер главы строкой).
  const chapterCardCount = chapter.data
    ? (cards.data ?? []).filter((c) => String(c.chapter) === String(chapter.data!.order)).length
    : 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link to={`/book/${bookId}`} className="link-back">
        <Icon name="arrow-left" size={15} />
        К книге
      </Link>

      {chapter.isLoading ? (
        <Loading label="Загружаем главу…" />
      ) : chapter.error ? (
        <div className="mt-6">
          <ErrorState message={(chapter.error as Error).message} />
        </div>
      ) : chapter.data ? (
        <>
          <header className="reveal mt-8">
            <p className="eyebrow">Глава {chapter.data.order}</p>
            <h1 className="font-display mt-2 text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              {chapter.data.title}
            </h1>
            <p className="mt-4 leading-relaxed text-ink-soft">{chapter.data.description}</p>

            <LearningOutcome text={chapter.data.learning_outcome} />

            {chapterCardCount > 0 ? (
              <AddChapterToDeck
                bookId={bookId}
                order={chapter.data.order}
                count={chapterCardCount}
              />
            ) : null}
          </header>

          <section className="reveal mt-12" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            {chapter.data.topics.length === 0 ? (
              <EmptyState
                title="Темы пока не добавлены"
                hint="Материалы появятся после разбора главы на встрече."
              />
            ) : (
              <>
                <h2 className="font-display text-2xl font-semibold text-ink">Темы</h2>
                {/* Просто список: ни карточек на тему, ни рамки вокруг — у темы
                    есть только название, спикер и ссылки на материалы. */}
                <ul className="mt-3 divide-y divide-line">
                  {chapter.data.topics.map((topic, i) => (
                    <TopicRow key={topic.id} topic={topic} index={i} />
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

export default Chapter
