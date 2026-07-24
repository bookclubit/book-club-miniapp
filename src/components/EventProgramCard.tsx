import useSWR from 'swr'
import { fetchEventChapterTopics, fetchPublishedSlides, speakerAvatar } from '../lib/api'
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
  claimsUnavailable,
}: {
  event: ClubEvent
  claims: TopicClaim[]
  // Заявки из бота не загрузились: темы показываем свободными + мелкая подпись.
  claimsUnavailable?: boolean
  showSlots: boolean
}) {
  // Для «докладов» темы главы — слоты (и в плане, и в архиве). Единый источник
  // занятости — заявки D1 (event.talks больше не используется).
  const isLiveTalk = event.type === 'live-talk' && Boolean(event.book_id && event.chapter)

  const { data: topics } = useSWR<TopicRef[]>(
    isLiveTalk ? `plan-topics:${event.book_id}:${event.chapter}` : null,
    () => fetchEventChapterTopics(event.book_id!, event.chapter!),
  )

  // Если главу делят на несколько встреч, у встречи задан свой набор тем
  // (topic_ids) — показываем только их. Нет набора → вся глава (одна встреча).
  const eventTopicIds =
    event.type === 'live-talk' ? event.topic_ids : undefined
  const chapterTopics =
    eventTopicIds && eventTopicIds.length > 0
      ? topics?.filter((t) => eventTopicIds.includes(t.id))
      : topics

  const slots: TopicSlot[] | undefined = chapterTopics?.map((topic) => {
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

  // Ссылка на слайды появляется, когда презентация принята — PR спикера
  // смержен в book-club-talks (до мержа боевой URL slides_url отдаёт 404).
  const slideUrls = (slots ?? [])
    .map((s) => s.slidesUrl)
    .filter((u): u is string => Boolean(u))
  const { data: publishedSlides } = useSWR<Set<string>>(
    slideUrls.length > 0 ? `slides-published:${slideUrls.join(',')}` : null,
    () => fetchPublishedSlides(slideUrls),
  )
  const gatedSlots = slots?.map((s) =>
    s.slidesUrl && !publishedSlides?.has(s.slidesUrl)
      ? { ...s, slidesUrl: undefined }
      : s,
  )

  // В плане показываем все темы (свободные тоже), в архиве — только занятые.
  const visibleSlots =
    gatedSlots && !showSlots ? gatedSlots.filter((s) => s.speaker) : gatedSlots

  return (
    <EventCard
      event={event}
      topicSlots={visibleSlots}
      topicSlotsNote={
        isLiveTalk && claimsUnavailable
          ? 'Занятость тем временно недоступна — все темы показаны свободными.'
          : undefined
      }
    />
  )
}

export default EventProgramCard
