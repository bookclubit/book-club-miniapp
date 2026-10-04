import { bookTitleById } from '../lib/api'
import { formatDateWithYear } from '../lib/format'
import type { SpeakerTalk } from '../lib/speakers'
import MaterialLinks, { type Material } from './MaterialLinks'

// Материалы доклада: слайды и записи. Пока встреча не прошла, «запись» —
// ссылка на будущий эфир, поэтому подпись зависит от статуса встречи.
function talkMaterials(talk: SpeakerTalk): Material[] {
  return [
    ...(talk.slidesUrl
      ? [{ kind: 'slides' as const, href: talk.slidesUrl, label: 'Слайды доклада' }]
      : []),
    ...(talk.youtube
      ? [
          {
            kind: 'youtube' as const,
            href: talk.youtube,
            label: talk.finished ? 'Запись на YouTube' : 'Эфир на YouTube',
          },
        ]
      : []),
    ...(talk.vk
      ? [
          {
            kind: 'vk' as const,
            href: talk.vk,
            label: talk.finished ? 'Запись в VK' : 'Эфир в VK',
          },
        ]
      : []),
  ]
}

/**
 * Состоявшиеся доклады списком с разделителями, материалы иконками — как темы
 * главы. Один список на профиль спикера и на личный профиль: один и тот же
 * доклад не должен выглядеть в двух местах по-разному.
 */
function TalkList({ talks }: { talks: SpeakerTalk[] }) {
  return (
    <ul className="divide-y divide-line">
      {talks.map((t, i) => (
        <li
          key={t.eventId + t.talkTitle}
          className="reveal py-3"
          style={{ '--reveal-delay': `${100 + i * 50}ms` } as React.CSSProperties}
        >
          {/* Название и материалы — на одной строке, дата с книгой — второй.
              Названия встречи здесь нет: оно повторяет главу. */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 font-display text-base font-semibold leading-snug text-ink">
              {t.talkTitle}
            </h3>
            <MaterialLinks items={talkMaterials(t)} />
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-faint">
            <span>
              {t.date
                ? formatDateWithYear(t.date)
                : t.chapterOrder
                  ? `Глава ${t.chapterOrder}`
                  : 'Доклад'}
            </span>
            {bookTitleById(t.bookId) ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{bookTitleById(t.bookId)}</span>
              </>
            ) : null}
            {t.pending ? (
              <span className="rounded-full bg-canvas px-2 py-0.5">заявка</span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default TalkList
