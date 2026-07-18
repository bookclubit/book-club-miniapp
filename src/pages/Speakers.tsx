import useSWR from 'swr'
import EmptyState from '../components/EmptyState'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import SpeakerCard from '../components/SpeakerCard'
import { fetchClaims, fetchEvents, fetchSpeakers } from '../lib/api'
import type { TopicClaim } from '../lib/api'
import { collectSpeakerTalks } from '../lib/speakers'
import type { ClubEvent, IndexSpeaker } from '../types'

// Вкладка «Спикеры»: карточки участников клуба, которые выступали с докладами.
function Speakers() {
  const speakers = useSWR<IndexSpeaker[]>('speakers', fetchSpeakers)
  const events = useSWR<ClubEvent[]>('events', fetchEvents)
  const { data: claims } = useSWR<TopicClaim[]>('topic-claims', fetchClaims)

  const counts = new Map<string, number>()
  for (const s of speakers.data ?? []) {
    counts.set(s.id, collectSpeakerTalks(events.data ?? [], s, claims ?? []).length)
  }

  // Сначала активные докладчики (больше докладов), затем по алфавиту.
  const ordered = [...(speakers.data ?? [])].sort((a, b) => {
    const diff = (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)
    return diff !== 0 ? diff : a.name.localeCompare(b.name)
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="reveal max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Спикеры</h1>
        <p className="mt-2 text-ink-soft">
          Участники клуба, которые делятся знаниями с докладами. Нажми на карточку —
          там профиль, соцсети и все выступления.
        </p>
      </header>

      <div className="mt-8">
        {speakers.isLoading ? (
          <Loading label="Загружаем спикеров…" />
        ) : speakers.error ? (
          <ErrorState message={(speakers.error as Error).message} />
        ) : ordered.length === 0 ? (
          <EmptyState title="Спикеров пока нет" hint="Стать первым можно через бота — кнопка «Стать спикером»." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ordered.map((speaker, i) => (
              <div
                key={speaker.id}
                className="reveal"
                style={{ '--reveal-delay': `${60 + i * 60}ms` } as React.CSSProperties}
              >
                <SpeakerCard speaker={speaker} talkCount={counts.get(speaker.id) ?? 0} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Speakers
