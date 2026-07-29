import { Link } from 'react-router-dom'
import MaterialLinks, { type Material } from './MaterialLinks'
import { speakerAvatar, speakerByName } from '../lib/api'
import type { Topic } from '../types'

// Спикер темы: маленький аватар + имя. Если спикер есть в реестре — ведёт на
// его страницу. Плашки-пилюли здесь нет: у темы кроме названия почти ничего
// нет, и рамка вокруг имени перевешивала бы саму тему.
function SpeakerLink({ name }: { name: string }) {
  const avatar = speakerAvatar(name)
  const speaker = speakerByName(name)

  const body = (
    <>
      {avatar ? (
        <img
          src={avatar}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          className="h-5 w-5 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[0.625rem] font-semibold text-accent-strong"
        >
          {name.slice(0, 1)}
        </span>
      )}
      <span>{name}</span>
    </>
  )

  const shell = 'inline-flex items-center gap-1.5 text-xs text-ink-faint'

  return speaker ? (
    <Link to={`/speaker/${speaker.id}`} className={`${shell} transition-colors hover:text-accent`}>
      {body}
    </Link>
  ) : (
    <span className={shell}>{body}</span>
  )
}

// Подпись доп. материала — домен ссылки (полный URL в подсказке нечитаем).
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function materials(topic: Topic): Material[] {
  return [
    ...(topic.video_youtube
      ? [{ kind: 'youtube' as const, href: topic.video_youtube, label: 'Запись на YouTube' }]
      : []),
    ...(topic.video_vk
      ? [{ kind: 'vk' as const, href: topic.video_vk, label: 'Запись в VK' }]
      : []),
    ...(topic.presentation
      ? [{ kind: 'slides' as const, href: topic.presentation, label: 'Презентация' }]
      : []),
    ...(topic.resources ?? []).map((url) => ({
      kind: 'link' as const,
      href: url,
      label: hostLabel(url),
    })),
  ]
}

/**
 * Тема главы одной строкой: номер, название, спикер и материалы иконками.
 * Раньше это была карточка с описанием темы — описания у тем больше нет,
 * поэтому карточка занимала полэкрана ради названия и двух ссылок.
 */
function TopicRow({ topic, index }: { topic: Topic; index: number }) {
  // Списки могут отсутствовать: файл главы правили руками или CDN отдал версию
  // до перехода на новую схему. Тогда показываем тему одним названием.
  const speakers = topic.speakers ?? []
  const links = materials(topic)

  return (
    <li
      className="reveal flex gap-3 px-5 py-4"
      style={{ '--reveal-delay': `${index * 60}ms` } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className="w-5 shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-ink-faint"
      >
        {index + 1}
      </span>

      {/* Название занимает всю ширину строки, спикер и иконки — под ним:
          на узком экране иначе заголовок жмётся до двух-трёх строк. */}
      <div className="min-w-0 grow">
        <h3 id={topic.id} className="font-display text-base font-semibold leading-snug text-ink">
          {topic.title}
        </h3>

        {speakers.length > 0 || links.length > 0 ? (
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              {speakers.map((name) => (
                <SpeakerLink key={name} name={name} />
              ))}
            </div>
            <MaterialLinks items={links} />
          </div>
        ) : null}
      </div>
    </li>
  )
}

export default TopicRow
