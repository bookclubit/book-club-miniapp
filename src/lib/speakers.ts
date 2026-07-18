import type { ClubEvent } from '../types'

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
}

// Все доклады спикера из событий-«докладов», от новых к старым.
export function collectSpeakerTalks(
  events: ClubEvent[],
  speakerId: string,
): SpeakerTalk[] {
  return events
    .filter((e) => e.type === 'live-talk')
    .flatMap((e) =>
      e.type === 'live-talk'
        ? e.talks
            .filter((t) => t.speaker_id === speakerId)
            .map((t) => ({
              eventId: e.id,
              eventTitle: e.title,
              date: e.date,
              bookId: e.book_id,
              talkTitle: t.title,
              slidesUrl: t.slides_url,
              youtube: e.streams?.youtube,
              vk: e.streams?.vk,
              finished: Boolean(e.finished),
            }))
        : [],
    )
    .sort((a, b) => b.date.localeCompare(a.date))
}
