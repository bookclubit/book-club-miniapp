import type { Topic } from '../types'

/**
 * Несколько тем главы бывают одним докладом: спикер берёт две-три подряд
 * идущие темы и рассказывает их вместе. Такие темы помечены общим
 * `talk_group` (id ведущей темы) и всюду, где речь о докладе — программа
 * эфира, слоты для брони, слайды — идут одной строкой через запятую.
 * Отдельными они остаются только на странице книги: это по-прежнему разные
 * темы главы, просто материалы у них общие.
 */
export function talkGroupKey(topic: Topic): string {
  return topic.talk_group?.trim() || topic.id
}

export interface TopicGroup {
  /** Общий ключ группы (id ведущей темы). */
  key: string
  topics: Topic[]
}

/** Темы главы по докладам, в порядке их появления в главе. */
export function topicGroups(topics: Topic[]): TopicGroup[] {
  const groups: TopicGroup[] = []
  const byKey = new Map<string, TopicGroup>()
  for (const topic of topics) {
    const key = talkGroupKey(topic)
    const group = byKey.get(key)
    if (group) group.topics.push(topic)
    else {
      const created = { key, topics: [topic] }
      byKey.set(key, created)
      groups.push(created)
    }
  }
  return groups
}

export function groupTitle(topics: Topic[]): string {
  return topics.map((t) => t.title).join(', ')
}

function uniq(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))]
}

/**
 * Темы «как их видит доклад»: объединённые склеены в одну тему с названием
 * через запятую и общими материалами. Идентификатор группы — id первой её
 * темы: на него ссылаются заявки в D1 и монтажные ролики встречи.
 */
export function mergeTalkTopics(topics: Topic[]): Topic[] {
  return topicGroups(topics).map(({ topics: group }) => {
    const [lead] = group
    if (group.length === 1) return lead
    return {
      ...lead,
      title: groupTitle(group),
      speakers: uniq(group.flatMap((t) => t.speakers ?? [])),
      video_youtube: group.map((t) => t.video_youtube?.trim()).find(Boolean) ?? '',
      video_vk: group.map((t) => t.video_vk?.trim()).find(Boolean) ?? '',
      presentation: group.map((t) => t.presentation?.trim()).find(Boolean) ?? '',
      resources: uniq(group.flatMap((t) => t.resources ?? [])),
    }
  })
}
