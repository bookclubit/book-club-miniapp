import type { TopicClaim } from './api'
import { isPast } from './format'
import type { ClubEvent, IndexSpeaker, LiveTalkEvent } from '../types'

// Доклад спикера с контекстом встречи — для профиля спикера.
export interface SpeakerTalk {
  eventId: string
  eventTitle: string
  date: string
  bookId?: string
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

// Все доклады спикера — из заявок D1 (единый источник занятости), от новых к
// старым. Заявка привязана к встрече по книге+главе; слайды берём из заявки.
export function collectSpeakerTalks(
  events: ClubEvent[],
  speaker: IndexSpeaker,
  claims: TopicClaim[],
): SpeakerTalk[] {
  const live = events.filter((e): e is LiveTalkEvent => e.type === 'live-talk')
  const talks: SpeakerTalk[] = []
  const seen = new Set<string>() // `<eventId>:<topicId|title>` — против дублей

  for (const c of claims) {
    if (!claimMatchesSpeaker(c, speaker)) continue
    const e =
      live.find((ev) => ev.book_id === c.book_id && ev.chapter === c.chapter) ??
      live.find((ev) => ev.book_id === c.book_id)
    if (!e) continue
    // Доклад показываем только после того, как встреча прошла (завершена
    // админом или дата уже позади) — будущие/текущие в профиль не попадают.
    if (!e.finished && !isPast(e.date)) continue
    const key = `${e.id}:${c.topic_id ?? c.topic_title}`
    if (seen.has(key)) continue
    seen.add(key)
    talks.push({
      eventId: e.id,
      eventTitle: e.title,
      date: e.date,
      bookId: e.book_id,
      talkTitle: c.topic_title,
      slidesUrl: c.slides_url ?? undefined,
      youtube: e.streams?.youtube,
      vk: e.streams?.vk,
      finished: Boolean(e.finished),
      pending: c.status !== 'confirmed',
    })
  }

  return talks.sort((a, b) => b.date.localeCompare(a.date))
}
