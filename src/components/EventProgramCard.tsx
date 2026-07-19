import useSWR from 'swr'
import { fetchEventChapterTopics, speakerAvatar } from '../lib/api'
import type { TopicClaim } from '../lib/api'
import type { ClubEvent, TopicRef } from '../types'
import EventCard from './EventCard'
import type { TopicSlot } from './EventCard'

// Единый источник истины для карточки встречи с программой докладов:
// используется и на главной, и на вкладке «Встречи», чтобы занятость тем
// считалась одинаково. Слот занят заявкой из бота (D1) ИЛИ докладом,
// назначенным админом в CMS (event.talks по topic_id/названию).
export function EventProgramCard({
  event,
  claims,
  showSlots,
}: {
  event: ClubEvent
  claims: TopicClaim[]
  showSlots: boolean
}) {
  // Для «докладов» темы главы — слоты (и в плане, и в архиве). Единый источник
  // занятости — заявки D1 (event.talks больше не используется).
  const isLiveTalk = event.type === 'live-talk' && Boolean(event.book_id && event.chapter)

  const { data: topics } = useSWR<TopicRef[]>(
    isLiveTalk ? `plan-topics:${event.book_id}:${event.chapter}` : null,
    () => fetchEventChapterTopics(event.book_id!, event.chapter!),
  )

  const slots: TopicSlot[] | undefined = topics?.map((topic) => {
    const claim = claims.find((c) => c.topic_id === topic.id)
    return {
      id: topic.id,
      title: topic.title,
      speaker: claim
        ? {
            name: claim.speaker,
            avatar: speakerAvatar(claim.speaker),
            pending: claim.status !== 'confirmed',
          }
        : undefined,
      slidesUrl: claim?.slides_url ?? undefined,
    }
  })

  // В плане показываем все темы (свободные тоже), в архиве — только занятые.
  const visibleSlots = slots && !showSlots ? slots.filter((s) => s.speaker) : slots

  return <EventCard event={event} topicSlots={visibleSlots} />
}

export default EventProgramCard
