import { Link, useParams } from 'react-router-dom'
import useSWR from 'swr'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { chapterUrl, fetcher } from '../lib/api'
import type { Chapter as ChapterData, Subchapter } from '../types'

// Блок одной подглавы: краткое содержание, инсайты, мнения спикеров.
function SubchapterBlock({ subchapter }: { subchapter: Subchapter }) {
  return (
    <div className="card">
      <h3 className="text-lg font-bold text-slate-900">{subchapter.title}</h3>
      <p className="mt-2 text-slate-600">{subchapter.summary}</p>

      {subchapter.insights.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">💡 Инсайты</p>
          <ul className="mt-2 space-y-2">
            {subchapter.insights.map((insight) => (
              <li
                key={insight}
                className="rounded-[12px] bg-canvas px-3 py-2 text-sm text-slate-700"
              >
                {insight}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {subchapter.speaker_notes.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">🎤 Мнения спикеров</p>
          <div className="mt-2 space-y-3">
            {subchapter.speaker_notes.map((note) => (
              <div
                key={note.speaker + note.opinion}
                className="flex gap-3 rounded-[12px] border border-line px-3 py-3"
              >
                <span className="text-xl">{note.avatar || '🧑‍💻'}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{note.speaker}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{note.opinion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// Страница главы: список подглав с инсайтами и мнениями + переход к карточкам.
function Chapter() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>()

  const { data, error, isLoading } = useSWR<ChapterData>(
    bookId && chapterId ? chapterUrl(bookId, chapterId) : null,
    fetcher,
  )

  if (!bookId || !chapterId) return <ErrorState message="Не указана глава." />

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link to={`/book/${bookId}`} className="text-sm text-primary hover:underline">
        ← К главам книги
      </Link>

      {isLoading ? (
        <Loading label="Загружаем главу…" />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : data ? (
        <>
          <header className="mt-4">
            <span className="text-sm font-medium text-primary">Глава {data.order}</span>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{data.title}</h1>
            <p className="mt-3 text-slate-600">{data.description}</p>
            <div className="mt-4 rounded-[12px] bg-canvas px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">🎯 Чему научишься</p>
              <p className="mt-1 text-sm text-slate-600">{data.learning_outcome}</p>
            </div>
            <Link to={`/study/${bookId}`} className="btn-primary mt-5">
              🎴 Учить карточки
            </Link>
          </header>

          <section className="mt-8 space-y-4">
            {data.subchapters.map((subchapter) => (
              <SubchapterBlock key={subchapter.id} subchapter={subchapter} />
            ))}
          </section>
        </>
      ) : null}
    </div>
  )
}

export default Chapter
