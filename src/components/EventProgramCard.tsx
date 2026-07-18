import useSWR from 'swr'
import { fetchEventChapterTopics, mediaUrl, speakerAvatar } from '../lib/api'
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
  const withTopics =
    showSlots && event.type === 'live-talk' && Boolean(event.book_id && event.chapter)

  const { data: topics } = useSWR<TopicRef[]>(
    withTopics ? `plan-topics:${event.book_id}:${event.chapter}` : null,
    () => fetchEventChapterTopics(event.book_id!, event.chapter!),
  )

  const talks = event.type === 'live-talk' ? event.talks : []
  const slots: TopicSlot[] | undefined = topics?.map((topic) => {
    const claim = claims.find((c) => c.topic_id === topic.id)
    const talk = talks.find((t) => t.topic_id === topic.id || t.title === topic.title)
    const speaker = claim
      ? {
          name: claim.speaker,
          avatar: speakerAvatar(claim.speaker),
          pending: claim.status !== 'confirmed',
        }
      : talk
        ? { name: talk.speaker, avatar: mediaUrl(talk.avatar) ?? speakerAvatar(talk.speaker) }
        : undefined
    return { id: topic.id, title: topic.title, speaker }
  })

  return <EventCard event={event} topicSlots={slots} />
}

export default EventProgramCard
