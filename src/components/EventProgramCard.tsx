import useSWR from 'swr'
import { bookTitleById, fetchEventChapterTopics, fetchPublishedSlides, speakerAvatar } from '../lib/api'
import type { TopicClaim } from '../lib/api'
import { eventProgram, isArchived } from '../lib/events'
import type { ClubEvent, Topic } from '../types'
import EventCard from './EventCard'
import type { TopicSlot } from './EventCard'

// Номер главы из слага папки («09-servernye-komponenty» → 9): в реестре он
// есть, но здесь хватает самого слага — так подпись не ждёт лишней загрузки.
function chapterOrderOf(slug: string): number | string {
  const n = Number(slug.split('-')[0])
  return Number.isFinite(n) ? n : slug
}

// Единый источник истины для карточки встречи с программой докладов:
// используется и на главной, и на вкладке «Встречи», чтобы занятость тем
// считалась одинаково. Слот занят заявкой из бота (D1) ИЛИ докладом,
// назначенным админом в CMS (event.talks по topic_id/названию).
export function EventProgramCard({
  event,
  claims,
  showSlots,
  claimsUnavailable,
  dateOutside,
}: {
  event: ClubEvent
  claims: TopicClaim[]
  // Заявки из бота не загрузились: темы показываем свободными + мелкая подпись.
  claimsUnavailable?: boolean
  showSlots: boolean
  /** Дата показана снаружи карточки (таймлайн «Встреч»). */
  dateOutside?: boolean
}) {
  // Для «докладов» темы программы — слоты (и в плане, и в архиве). Единый
  // источник занятости — заявки D1 (event.talks больше не используется).
  // Программа блоками: за вечер разбирают несколько глав и даже книг.
  const blocks = eventProgram(event)
  const isLiveTalk = event.type === 'live-talk' && blocks.length > 0
  const archived = isArchived(event)

  // Ключ — вся программа целиком, как её видит загрузчик ниже. Раньше в ключ
  // шли только книга и глава: у двух встреч по одной главе (101 и 102) ключи
  // совпадали, и SWR отдавал обеим темы того эфира, который загрузился первым.
  // Сериализация блоков защищает от повтора: новое поле, влияющее на набор тем,
  // попадёт в ключ само.
  const programKey = JSON.stringify(blocks)

  const { data: program } = useSWR<{ block: (typeof blocks)[number]; topics: Topic[] }[]>(
    isLiveTalk ? `plan-topics:${programKey}` : null,
    async () =>
      Promise.all(
        blocks.map(async (block) => {
          const topics = await fetchEventChapterTopics(block.book_id, block.chapter)
          // У блока может быть свой набор тем — если главу делят между эфирами.
          const ids = block.topic_ids
          return {
            block,
            topics: ids && ids.length > 0 ? topics.filter((t) => ids.includes(t.id)) : topics,
          }
        }),
      ),
  )

  // Подписываем главу у тем, только когда глав в программе больше одной:
  // у обычного эфира по одной главе подпись была бы шумом.
  const manyChapters = (program ?? []).filter((p) => p.topics.length > 0).length > 1
  const manyBooks = new Set(blocks.map((b) => b.book_id)).size > 1

  const slots: TopicSlot[] | undefined = program?.flatMap(({ block, topics }) =>
    topics.map((topic) => {
      const claim = claims.find((c) => c.topic_id === topic.id)
      const bookTitle = manyBooks ? bookTitleById(block.book_id) : undefined
      // Заявок в D1 у старых встреч нет — там докладчик записан прямо в теме
      // главы (`topic.speakers`). Берём его как замену, иначе прошедший вечер
      // выглядел бы пустым, хотя на странице книги и в профиле спикер есть.
      const fromChapter = archived ? topic.speakers?.[0] : undefined
      const speakerName = claim?.speaker ?? fromChapter
      return {
        id: topic.id,
        title: topic.title,
        group: manyChapters
          ? [bookTitle, `глава ${chapterOrderOf(block.chapter)}`].filter(Boolean).join(' · ')
          : undefined,
        speaker: speakerName
          ? {
              name: speakerName,
              avatar: speakerAvatar(speakerName),
              pending: claim ? claim.status !== 'confirmed' : false,
            }
          : undefined,
        slidesUrl: claim?.slides_url ?? undefined,
      }
    }),
  )

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
      dateOutside={dateOutside}
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
