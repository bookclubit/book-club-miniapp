import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import ErrorState from '../components/ErrorState'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import Loading from '../components/Loading'
import LearningOutcome from '../components/LearningOutcome'
import AddChapterToDeck from '../components/AddChapterToDeck'
import TopicSection from '../components/TopicSection'
import { chapterUrl, fetchFlashcards, fetchTopics, fetcher } from '../lib/api'
import type { Chapter as ChapterData, Flashcard, Topic } from '../types'

// Страница главы: описание, ожидаемый результат и темы (Markdown-материалы).
function Chapter() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>()

  const chapter = useSWR<ChapterData>(
    bookId && chapterId ? chapterUrl(bookId, chapterId) : null,
    fetcher,
  )
  // У главы может ещё не быть тем (topics: []) — тогда и грузить нечего,
  // сразу покажем пустое состояние.
  const topics = useSWR<Topic[]>(
    chapter.data && chapter.data.topics.length > 0 ? `topics:${bookId}:${chapterId}` : null,
    () => fetchTopics(bookId as string, chapterId as string, chapter.data as ChapterData),
  )
  const cards = useSWR<Flashcard[]>(
    bookId ? `flashcards:${bookId}` : null,
    () => fetchFlashcards(bookId as string),
  )

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

          <div className="mt-12">
            {topics.isLoading ? (
              <Loading label="Загружаем темы…" />
            ) : topics.error ? (
              <ErrorState message={(topics.error as Error).message} />
            ) : !topics.data || topics.data.length === 0 ? (
              <EmptyState
                title="Темы пока не добавлены"
                hint="Материалы появятся после разбора главы на встрече."
              />
            ) : (
              <div className="space-y-5">
                {topics.data.map((topic, i) => (
                  <TopicSection key={topic.meta.id} topic={topic} index={i} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default Chapter
