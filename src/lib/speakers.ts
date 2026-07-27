import { bookFolderById, type ChapterTopics, type TopicClaim } from './api'
import { isPast } from './format'
import type { ClubEvent, IndexSpeaker, LiveTalkEvent, Topic } from '../types'

// Доклад спикера с контекстом встречи — для профиля спикера.
export interface SpeakerTalk {
  eventId: string
  eventTitle: string
  /** Дата встречи. У старых докладов события нет — тогда даты тоже нет. */
  date?: string
  bookId?: string
  /** Глава книги: контекст для доклада, у которого нет встречи. */
  chapterTitle?: string
  chapterOrder?: number
  talkTitle: string
  slidesUrl?: string
  youtube?: string
  vk?: string
  finished: boolean
  /** Заявка ещё на модерации (взята через бота, админ не подтвердил). */
  pending?: boolean
}

// Заявка принадлежит этому спикеру: по каталожному speaker_id (бот узнал по
// Telegram) либо по имени/алиасу (заявка через бота без привязки).
function claimMatchesSpeaker(claim: TopicClaim, speaker: IndexSpeaker): boolean {
  if (claim.speaker_id && claim.speaker_id === speaker.id) return true
  return claim.speaker === speaker.name || speaker.aliases.includes(claim.speaker)
}

// В темах главы спикер записан именем или алиасом («Антон», «Антон Помазков»).
function topicMatchesSpeaker(topic: Topic, speaker: IndexSpeaker): boolean {
  return (topic.speakers ?? []).some(
    (name) => name === speaker.name || speaker.aliases.includes(name),
  )
}

// Встреча заявки: если главу делят на несколько эфиров, тема явно приписана к
// одному из них (topic_ids). Иначе — единственная встреча по книге+главе.
function findEventForClaim(
  live: LiveTalkEvent[],
  c: TopicClaim,
): LiveTalkEvent | undefined {
  if (c.topic_id) {
    const byTopic = live.find(
      (ev) => ev.book_id === c.book_id && ev.topic_ids?.includes(c.topic_id!),
    )
    if (byTopic) return byTopic
  }
  return (
    live.find((ev) => ev.book_id === c.book_id && ev.chapter === c.chapter) ??
    live.find((ev) => ev.book_id === c.book_id)
  )
}

// Встреча темы главы: сопоставляем по папке книги (в событии book_id — id из
// meta) и слагу главы, точнее — по явному списку тем эфира.
function findEventForTopic(
  live: LiveTalkEvent[],
  chapter: ChapterTopics,
  topic: Topic,
): LiveTalkEvent | undefined {
  const ofBook = live.filter((ev) => bookFolderById(ev.book_id) === chapter.bookFolder)
  return (
    ofBook.find((ev) => ev.topic_ids?.includes(topic.id)) ??
    ofBook.find((ev) => ev.chapter === chapter.chapterSlug)
  )
}

/**
 * Доклады спикера из двух источников — иначе профиль расходится с книгой.
 *
 * 1. Заявки в D1 (`/api/claims`) — свежие брони: слайды из заявки, монтажный
 *    ролик из `event.recordings`, плюс статус «заявка» до подтверждения.
 * 2. Темы глав в book-club-data — так записаны все прошлые доклады: спикер
 *    указан в `topic.speakers`, ссылки лежат в самой теме. Событий за старые
 *    главы в клубе не заводили, поэтому у таких докладов нет даты — сортируем
 *    их после датированных, по номеру главы.
 *
 * Тема, попавшая в оба источника, показывается одной карточкой: ссылки из
 * данных клуба дополняют заявку, а не спорят с ней.
 */
export function collectSpeakerTalks(
  events: ClubEvent[],
  speaker: IndexSpeaker,
  claims: TopicClaim[],
  chapters: ChapterTopics[] = [],
): SpeakerTalk[] {
  const live = events.filter((e): e is LiveTalkEvent => e.type === 'live-talk')
  // Ключ — id темы (он уникален по всем книгам); у старых заявок без темы
  // роль ключа играет пара «встреча + название».
  const byKey = new Map<string, SpeakerTalk>()

  for (const c of claims) {
    if (!claimMatchesSpeaker(c, speaker)) continue
    const e = findEventForClaim(live, c)
    if (!e) continue
    // Доклад показываем только после того, как встреча прошла (завершена
    // админом или дата уже позади) — будущие/текущие в профиль не попадают.
    if (!e.finished && !isPast(e.date)) continue
    const key = c.topic_id ?? `${e.id}:${c.topic_title}`
    if (byKey.has(key)) continue
    // Монтажный ролик именно этого доклада (вносит админ), не запись встречи.
    const recording = c.topic_id ? e.recordings?.[c.topic_id] : undefined
    byKey.set(key, {
      eventId: e.id,
      eventTitle: e.title,
      date: e.date,
      bookId: bookFolderById(e.book_id) ?? e.book_id,
      talkTitle: c.topic_title,
      slidesUrl: c.slides_url ?? undefined,
      youtube: recording?.youtube,
      vk: recording?.vk,
      finished: Boolean(e.finished),
      pending: c.status !== 'confirmed',
    })
  }

  for (const chapter of chapters) {
    for (const topic of chapter.topics) {
      if (!topicMatchesSpeaker(topic, speaker)) continue

      const materials = {
        slidesUrl: topic.presentation?.trim() || undefined,
        youtube: topic.video_youtube?.trim() || undefined,
        vk: topic.video_vk?.trim() || undefined,
      }
      const event = findEventForTopic(live, chapter, topic)
      const happened =
        Boolean(materials.youtube || materials.vk || materials.slidesUrl) ||
        Boolean(event && (event.finished || isPast(event.date)))
      // Тема закреплена за спикером на будущий эфир — это ещё не доклад.
      if (!happened) continue

      const existing = byKey.get(topic.id)
      if (existing) {
        // Заявка знает дату и статус, данные клуба — ссылки. Дополняем.
        existing.slidesUrl ??= materials.slidesUrl
        existing.youtube ??= materials.youtube
        existing.vk ??= materials.vk
        existing.chapterTitle ??= chapter.chapterTitle
        existing.chapterOrder ??= chapter.chapterOrder
        continue
      }

      byKey.set(topic.id, {
        eventId: event?.id ?? `${chapter.bookFolder}:${chapter.chapterSlug}`,
        eventTitle: event?.title ?? chapter.chapterTitle,
        ...(event ? { date: event.date } : {}),
        bookId: chapter.bookFolder,
        chapterTitle: chapter.chapterTitle,
        chapterOrder: chapter.chapterOrder,
        talkTitle: topic.title,
        ...materials,
        // Есть материалы — доклад состоялся, даже если события за главу нет.
        finished: event ? Boolean(event.finished) : true,
      })
    }
  }

  // Датированные — от новых к старым; остальные (главы без события) после них,
  // от последней главы к первой.
  return [...byKey.values()].sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    if (b.date) return 1
    return (b.chapterOrder ?? 0) - (a.chapterOrder ?? 0)
  })
}
