import { useState } from 'react'
import { Link } from 'react-router-dom'
import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import Pill from '../components/Pill'
import TopicVote from '../components/TopicVote'
import { bookTitleById, fetchAllChapters, fetchIndex, matchSpeaker } from '../lib/api'
import type { ChapterTopics } from '../lib/api'
import { plural } from '../lib/format'
import { useTopicRatings, usefulPercent } from '../lib/ratings'
import type { TopicRating } from '../lib/account'
import type { ContentIndex } from '../types'

interface RatedTopic {
  id: string
  title: string
  bookFolder: string
  bookTitle: string
  chapterSlug: string
  chapterOrder: number
  speakers: string[]
  rating: TopicRating
}

// Страница «Топ»: рейтинг тем по всем книгам клуба. Темы берём из тех же глав,
// что и профиль спикера (ключ SWR 'chapters-all'), оценки — из D1 бота.
function Top() {
  const chapters = useSWR<ChapterTopics[]>('chapters-all', fetchAllChapters)
  const { data: index } = useSWR<ContentIndex>('index', fetchIndex)
  const { ratingFor, minVotes, loading } = useTopicRatings()
  const [book, setBook] = useState('all')

  const all: RatedTopic[] = (chapters.data ?? []).flatMap((chapter) =>
    chapter.topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      bookFolder: chapter.bookFolder,
      bookTitle: bookTitleById(chapter.bookFolder) ?? chapter.bookFolder,
      chapterSlug: chapter.chapterSlug,
      chapterOrder: chapter.chapterOrder,
      speakers: topic.speakers ?? [],
      rating: ratingFor(topic.id),
    })),
  )

  // Книги, у которых есть хоть одна оценённая тема (для фильтра).
  const books: Array<{ folder: string; title: string }> = []
  for (const t of all) {
    if (t.rating.votes > 0 && !books.some((b) => b.folder === t.bookFolder)) {
      books.push({ folder: t.bookFolder, title: t.bookTitle })
    }
  }

  const visible = book === 'all' ? all : all.filter((t) => t.bookFolder === book)
  // Рейтинг: сначала по нижней границе Уилсона (её считает бот), при равенстве —
  // у кого больше оценок.
  const byScore = (a: RatedTopic, b: RatedTopic) =>
    b.rating.score - a.rating.score || b.rating.votes - a.rating.votes
  const ranked = visible.filter((t) => t.rating.votes >= minVotes).sort(byScore)
  // Тема с одной-двумя оценками в рейтинг не идёт: одна «полезно» обгоняла бы
  // тему с двадцатью. Но показать их отдельно честно — видно, что оценки есть.
  const few = visible
    .filter((t) => t.rating.votes > 0 && t.rating.votes < minVotes)
    .sort((a, b) => b.rating.votes - a.rating.votes)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="reveal">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Топ тем</h1>
        <p className="mt-2 text-ink-soft">
          Что участники клуба отметили как полезное — по всем книгам. Оценка ставится
          в один тап на странице главы или здесь.
        </p>
      </header>

      {books.length > 1 ? (
        <div
          className="reveal mt-6 flex flex-wrap gap-2"
          style={{ '--reveal-delay': '60ms' } as React.CSSProperties}
        >
          <Pill active={book === 'all'} onClick={() => setBook('all')}>
            Все книги
          </Pill>
          {books.map((b) => (
            <Pill key={b.folder} active={book === b.folder} onClick={() => setBook(b.folder)}>
              {b.title}
            </Pill>
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        {chapters.isLoading || loading ? (
          <Loading label="Считаем рейтинг…" />
        ) : chapters.error ? (
          <ErrorState message={(chapters.error as Error).message} />
        ) : ranked.length === 0 && few.length === 0 ? (
          <EmptyState
            title="Темы пока не оценивали"
            hint="Откройте главу книги и отметьте, что было полезно."
          />
        ) : (
          <>
            <ul className="divide-y divide-line">
              {ranked.map((topic, i) => (
                <TopRow key={topic.id} place={i + 1} topic={topic} speakerIndex={index} />
              ))}
            </ul>

            {few.length > 0 ? (
              <section className="mt-10">
                <h2 className="font-display text-lg font-semibold text-ink">
                  Ещё мало оценок
                </h2>
                <p className="mt-1 text-xs text-ink-faint">
                  В рейтинг тема попадает с {minVotes} {plural(minVotes, 'оценки', 'оценок', 'оценок')}.
                </p>
                <ul className="mt-3 divide-y divide-line">
                  {few.map((topic) => (
                    <TopRow key={topic.id} topic={topic} speakerIndex={index} />
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

// Ссылки в мета-строке: тише названия, акцент только по наведению.
const metaLinkClass = 'transition-colors hover:text-accent'

// Строка рейтинга: место, название (ведёт в главу), доля «полезно» и оценка.
function TopRow({
  place,
  topic,
  speakerIndex,
}: {
  place?: number
  topic: RatedTopic
  speakerIndex?: ContentIndex
}) {
  const percent = usefulPercent(topic.rating)
  // Имя спикера — полное, из реестра (в данных тема подписана как придётся);
  // id нужен, чтобы вести на его страницу. Нет в реестре — просто текст.
  const speakers = topic.speakers.map((name) => {
    const speaker = matchSpeaker(speakerIndex?.speakers ?? [], name)
    return { name: speaker?.name ?? name, id: speaker?.id }
  })
  const chapterHref = `/book/${topic.bookFolder}/chapter/${topic.chapterSlug}`

  return (
    <li className="reveal flex items-center gap-3 py-3">
      {place ? (
        <span
          aria-hidden="true"
          className="w-6 shrink-0 text-center font-display text-lg font-semibold tabular-nums text-ink-faint"
        >
          {place}
        </span>
      ) : null}

      <div className="min-w-0 grow">
        <Link
          to={chapterHref}
          className="font-display text-base font-semibold leading-snug text-ink transition-colors hover:text-accent"
        >
          {topic.title}
        </Link>
        {/* Книга, глава и спикер — ссылки на свои страницы: из рейтинга обычно
            и хочется уйти к материалу или к человеку. */}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-faint">
          <span className="font-semibold text-ink-soft">{percent}% полезно</span>
          <span aria-hidden="true">·</span>
          <span>
            {topic.rating.votes} {plural(topic.rating.votes, 'оценка', 'оценки', 'оценок')}
          </span>
          <span aria-hidden="true">·</span>
          <Link to={`/book/${topic.bookFolder}`} className={metaLinkClass}>
            {topic.bookTitle}
          </Link>
          <span aria-hidden="true">·</span>
          <Link to={chapterHref} className={metaLinkClass}>
            Глава {topic.chapterOrder}
          </Link>
          {speakers.map((speaker) => (
            <span key={speaker.name} className="flex items-center gap-x-2">
              <span aria-hidden="true">·</span>
              {speaker.id ? (
                <Link to={`/speaker/${speaker.id}`} className={metaLinkClass}>
                  {speaker.name}
                </Link>
              ) : (
                <span>{speaker.name}</span>
              )}
            </span>
          ))}
        </p>
      </div>

      <TopicVote topicId={topic.id} />
    </li>
  )
}

export default Top
