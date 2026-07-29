import { Link } from 'react-router-dom'
import useSWR from 'swr'
import MaterialLinks, { type Material } from './MaterialLinks'
import { fetchIndex, matchSpeaker } from '../lib/api'
import type { ContentIndex, Topic } from '../types'

/**
 * Спикер темы — только имя, ссылкой на его страницу (если он есть в реестре).
 * В данных спикер указан как придётся («Антон», «Антон Помазков»), поэтому имя
 * берём из реестра по алиасу: в списке тем должно стоять полное имя.
 *
 * Реестр берём через SWR (ключ общий со страницей главы — лишнего запроса нет):
 * из кэша api.ts он на первом рендере ещё пуст, и имя осталось бы коротким.
 */
function SpeakerLink({ name }: { name: string }) {
  const { data: index } = useSWR<ContentIndex>('index', fetchIndex)
  const speaker = matchSpeaker(index?.speakers ?? [], name)

  return speaker ? (
    <Link
      to={`/speaker/${speaker.id}`}
      className="text-xs text-ink-faint transition-colors hover:text-accent"
    >
      {speaker.name}
    </Link>
  ) : (
    <span className="text-xs text-ink-faint">{name}</span>
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
 * Тема главы одной строкой: название, спикер и материалы иконками.
 * Ни номера, ни аватарки: у темы больше нет описания, и любая добавка
 * перевешивает то немногое, что тема несёт.
 */
function TopicRow({ topic, index }: { topic: Topic; index: number }) {
  // Списки могут отсутствовать: файл главы правили руками или CDN отдал версию
  // до перехода на новую схему. Тогда показываем тему одним названием.
  const speakers = topic.speakers ?? []
  const links = materials(topic)

  return (
    <li
      className="reveal py-3"
      style={{ '--reveal-delay': `${index * 50}ms` } as React.CSSProperties}
    >
      {/* Название и материалы — на одной строке, спикер — второй строкой. */}
      <div className="flex items-center justify-between gap-3">
        <h3
          id={topic.id}
          className="min-w-0 font-display text-base font-semibold leading-snug text-ink"
        >
          {topic.title}
        </h3>
        <MaterialLinks items={links} />
      </div>

      {speakers.length > 0 ? (
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {speakers.map((name) => (
            <SpeakerLink key={name} name={name} />
          ))}
        </div>
      ) : null}
    </li>
  )
}

export default TopicRow
