import { Link } from 'react-router-dom'
import { speakerAvatar, speakerByName } from '../lib/api'
import Icon from './Icon'
import type { Topic } from '../types'

interface TopicSectionProps {
  topic: Topic
  index: number
}

// Спикер темы: аватарка + имя. Если спикер есть в реестре — ведёт на его страницу.
function SpeakerChip({ name }: { name: string }) {
  const avatar = speakerAvatar(name)
  const speaker = speakerByName(name)

  const body = (
    <>
      {avatar ? (
        <img
          src={avatar}
          alt=""
          width={28}
          height={28}
          loading="lazy"
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong"
        >
          {name.slice(0, 1)}
        </span>
      )}
      <span className="text-sm font-medium text-ink">{name}</span>
    </>
  )

  const shell = 'inline-flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3'

  return speaker ? (
    <Link
      to={`/speaker/${speaker.id}`}
      className={`${shell} transition hover:border-line-strong hover:bg-canvas`}
    >
      {body}
    </Link>
  ) : (
    <span className={shell}>{body}</span>
  )
}

// Ссылка-материал темы: иконка + подпись.
function MaterialLink({
  href,
  icon,
  label,
}: {
  href: string
  icon: 'play' | 'file' | 'external'
  label: string
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2 text-xs">
      <Icon name={icon} size={14} />
      {label}
    </a>
  )
}

// Подпись доп. материала — домен ссылки (полный URL в карточке нечитаем).
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// Секция темы на странице главы: номер, название, спикеры и ссылки на материалы.
function TopicSection({ topic, index }: TopicSectionProps) {
  // Списки могут отсутствовать: файл главы правили руками или CDN отдал версию
  // до перехода на новую схему. Тогда показываем тему одним названием.
  const speakers = topic.speakers ?? []
  const resources = topic.resources ?? []

  const materials = [
    topic.video_youtube ? { href: topic.video_youtube, icon: 'play' as const, label: 'Запись на YouTube' } : null,
    topic.video_vk ? { href: topic.video_vk, icon: 'play' as const, label: 'Запись в VK' } : null,
    topic.presentation ? { href: topic.presentation, icon: 'file' as const, label: 'Презентация' } : null,
    ...resources.map((url) => ({
      href: url,
      icon: 'external' as const,
      label: hostLabel(url),
    })),
  ].filter((m): m is { href: string; icon: 'play' | 'file' | 'external'; label: string } => m !== null)

  return (
    <section
      aria-labelledby={topic.id}
      className="card reveal p-6"
      style={{ '--reveal-delay': `${index * 90}ms` } as React.CSSProperties}
    >
      <div className="flex items-baseline gap-3">
        <span aria-hidden="true" className="font-display text-2xl font-semibold text-line-strong">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h2 id={topic.id} className="font-display text-xl font-semibold text-ink">
          {topic.title}
        </h2>
      </div>

      {speakers.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {speakers.map((name) => (
            <SpeakerChip key={name} name={name} />
          ))}
        </div>
      ) : null}

      {materials.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
          {materials.map((m) => (
            <MaterialLink key={m.href} href={m.href} icon={m.icon} label={m.label} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default TopicSection
