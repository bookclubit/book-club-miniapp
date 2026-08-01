import { Link } from 'react-router-dom'
import useSWR from 'swr'
import MaterialLinks, { type Material } from './MaterialLinks'
import { fetchIndex, matchSpeaker, mediaUrl } from '../lib/api'
import type { TopicMaterials } from '../lib/materials'
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
  const avatar = mediaUrl(speaker?.avatar)

  const body = (
    <>
      {avatar ? (
        <img
          src={avatar}
          alt=""
          width={20}
          height={20}
          loading="lazy"
          className="h-5 w-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-strong"
        >
          {name.slice(0, 1)}
        </span>
      )}
      <span>{speaker?.name ?? name}</span>
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

function materialLinks(materials: TopicMaterials): Material[] {
  return [
    ...(materials.youtube
      ? [{ kind: 'youtube' as const, href: materials.youtube, label: 'Запись на YouTube' }]
      : []),
    ...(materials.vk
      ? [{ kind: 'vk' as const, href: materials.vk, label: 'Запись в VK' }]
      : []),
    ...(materials.slidesUrl
      ? [{ kind: 'slides' as const, href: materials.slidesUrl, label: 'Презентация' }]
      : []),
    ...materials.resources.map((url) => ({
      kind: 'link' as const,
      href: url,
      label: hostLabel(url),
    })),
  ]
}

/**
 * Тема главы одной строкой: название с материалами, спикер второй строкой.
 * Номера у темы нет — порядок задаёт сам список.
 *
 * `materials` приходит со страницы: спикер и монтажный ролик доклада живут
 * не в теме, а в заявках и во встрече. Без них строка молчала бы о докладе,
 * который в профиле спикера уже виден.
 */
function TopicRow({
  topic,
  index,
  materials,
}: {
  topic: Topic
  index: number
  materials?: TopicMaterials
}) {
  // Списки могут отсутствовать: файл главы правили руками или CDN отдал версию
  // до перехода на новую схему. Тогда показываем тему одним названием.
  const merged = materials ?? {
    speakers: topic.speakers ?? [],
    youtube: topic.video_youtube || undefined,
    vk: topic.video_vk || undefined,
    slidesUrl: topic.presentation || undefined,
    resources: topic.resources ?? [],
  }
  const speakers = merged.speakers
  const links = materialLinks(merged)

  return (
    <li
      className="reveal py-4"
      style={{ '--reveal-delay': `${index * 50}ms` } as React.CSSProperties}
    >
      <div className="min-w-0">
        {/* Название и материалы — на одной строке, спикер — второй строкой. */}
        <div className="flex items-center justify-between gap-3">
          {/* id — якорь темы: на него ведут ссылки из «Топа» и профиля спикера
              (scroll-mt — чтобы липкая шапка не закрывала название). */}
          <h3
            id={topic.id}
            className="min-w-0 scroll-mt-20 font-display text-base font-semibold leading-snug text-ink"
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
      </div>
    </li>
  )
}

export default TopicRow
