import { Link } from 'react-router-dom'
import { mediaUrl } from '../lib/api'
import { plural } from '../lib/format'
import type { IndexSpeaker } from '../types'

// Карточка спикера: аватар, имя, краткое описание и число докладов.
// Вся карточка — ссылка на профиль спикера.
function SpeakerCard({ speaker, talkCount }: { speaker: IndexSpeaker; talkCount: number }) {
  return (
    <Link to={`/speaker/${speaker.id}`} className="card card-hover group flex flex-col items-center p-5 text-center">
      <img
        src={mediaUrl(speaker.avatar)}
        alt={`Аватар ${speaker.name}`}
        width={80}
        height={80}
        loading="lazy"
        className="h-20 w-20 rounded-full object-cover ring-2 ring-line transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <h3 className="font-display mt-3 text-base font-semibold leading-snug text-ink">
        {speaker.name}
      </h3>
      {speaker.bio ? (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-soft">{speaker.bio}</p>
      ) : null}
      <span className="mt-3 text-xs font-medium text-ink-faint">
        {talkCount > 0
          ? `${talkCount} ${plural(talkCount, 'доклад', 'доклада', 'докладов')}`
          : 'Пока без докладов'}
      </span>
    </Link>
  )
}

export default SpeakerCard
