import { bookFolderById, type TopicClaim } from './api'
import { eventProgram, isArchived } from './events'
import type { ClubEvent, LiveTalkEvent, Topic } from '../types'

/**
 * Материалы темы собираются из двух мест, и это не случайность: сама тема
 * в book-club-data знает только то, что вносили руками (спикер, ссылки),
 * а всё новое живёт в оперативных данных — спикер в заявке (D1 бота),
 * монтажный ролик в `recordings` встречи. Раньше страница книги читала
 * только тему, поэтому у свежих глав не показывала ни спикера, ни записи,
 * хотя в профиле спикера они были.
 */
export interface TopicMaterials {
  /** Имена спикеров: из темы и из подтверждённых заявок. */
  speakers: string[]
  youtube?: string
  vk?: string
  slidesUrl?: string
  resources: string[]
}

/**
 * Эфир, на котором разбирали тему: сначала по явному списку тем (главу делят
 * между эфирами), иначе — первый эфир по этой главе. По книге целиком НЕ ищем:
 * иначе тема будущей главы прилипала бы к старой встрече.
 */
export function findTopicEvent(
  events: ClubEvent[],
  bookFolder: string | undefined,
  chapterSlug: string,
  topicId: string,
): LiveTalkEvent | undefined {
  const live = events.filter((e): e is LiveTalkEvent => e.type === 'live-talk')
  const blocks = (ev: LiveTalkEvent) =>
    eventProgram(ev).filter((b) => !bookFolder || bookFolderById(b.book_id) === bookFolder)
  return (
    live.find((ev) => blocks(ev).some((b) => b.topic_ids?.includes(topicId))) ??
    live.find((ev) => blocks(ev).some((b) => b.chapter === chapterSlug))
  )
}

/** Монтажный ролик доклада (вносит админ у встречи), не запись всего эфира. */
export function topicRecording(
  events: ClubEvent[],
  bookFolder: string | undefined,
  chapterSlug: string,
  topicId: string,
): { youtube?: string; vk?: string } {
  const event = findTopicEvent(events, bookFolder, chapterSlug, topicId)
  return event?.recordings?.[topicId] ?? {}
}

/**
 * Тема со всем, что о ней известно клубу. Порядок источников: то, что вписано
 * в саму тему, важнее — это ручная правка админа; оперативные данные дополняют.
 */
export function topicMaterials(
  topic: Topic,
  ctx: {
    events?: ClubEvent[]
    claims?: TopicClaim[]
    bookFolder?: string
    chapterSlug: string
    /** Принятые презентации: до мержа PR боевой адрес слайдов отдаёт 404. */
    publishedSlides?: Set<string>
  },
): TopicMaterials {
  const event = findTopicEvent(ctx.events ?? [], ctx.bookFolder, ctx.chapterSlug, topic.id)
  const recording = event?.recordings?.[topic.id] ?? {}

  // Заявка на будущий доклад — это ещё не доклад: в главе спикер и слайды
  // появляются, когда эфир прошёл (то же правило, что в профиле спикера).
  const claim =
    event && isArchived(event)
      ? (ctx.claims ?? []).find((c) => c.topic_id === topic.id && c.status === 'confirmed')
      : undefined

  const speakers = [...(topic.speakers ?? [])]
  if (claim && !speakers.includes(claim.speaker)) speakers.push(claim.speaker)

  const claimSlides =
    claim?.slides_url && (!ctx.publishedSlides || ctx.publishedSlides.has(claim.slides_url))
      ? claim.slides_url
      : undefined

  return {
    speakers,
    youtube: topic.video_youtube?.trim() || recording.youtube,
    vk: topic.video_vk?.trim() || recording.vk,
    slidesUrl: topic.presentation?.trim() || claimSlides,
    resources: topic.resources ?? [],
  }
}
