// Оценки тем: общее состояние для строк тем и вкладки «Топ».
// Оценки — оперативные данные, они живут в D1 бота (как брони и прогресс
// карточек), а не в git: голос должен учитываться сразу.

import useSWR from 'swr'
import {
  fetchTopicRatings,
  sendTopicVote,
  type TopicRating,
  type TopicRatingsResponse,
  type TopicVoteValue,
} from './account'
import { useAuth } from './useAuth'

const EMPTY: TopicRatingsResponse = { ratings: [], my: {}, min_votes: 3 }

/** Пустой свод — у неоценённой темы, чтобы вызывающим не проверять null. */
export function emptyRating(topicId: string): TopicRating {
  return { topic_id: topicId, up: 0, down: 0, votes: 0, score: 0 }
}

/** Заменяет свод одной темы в состоянии (и свою отметку). */
function withRating(
  state: TopicRatingsResponse,
  rating: TopicRating,
  myVote: TopicVoteValue,
): TopicRatingsResponse {
  const ratings = state.ratings.filter((r) => r.topic_id !== rating.topic_id)
  if (rating.votes > 0) ratings.push(rating)
  const my = { ...state.my }
  if (myVote === 0) delete my[rating.topic_id]
  else my[rating.topic_id] = myVote
  return { ...state, ratings, my }
}

export interface TopicRatingsApi {
  ratings: TopicRating[]
  /** Свод темы: у неоценённой — нули. */
  ratingFor: (topicId: string) => TopicRating
  /** Своя оценка темы: 1, -1 или 0. */
  myVote: (topicId: string) => TopicVoteValue
  /** С какого числа оценок тема попадает в рейтинг. */
  minVotes: number
  /** Оценивать может только вошедший — голос привязан к аккаунту. */
  canVote: boolean
  /** Нажатие: тот же выбор второй раз снимает оценку. */
  vote: (topicId: string, choice: 1 | -1) => Promise<void>
  loading: boolean
}

/**
 * Оценки тем с общим кэшем: строки тем и «Топ» пользуются одним ключом SWR,
 * поэтому оценка, поставленная в главе, сразу видна в рейтинге.
 */
export function useTopicRatings(): TopicRatingsApi {
  const { user } = useAuth()
  const { data, mutate, isLoading } = useSWR<TopicRatingsResponse>(
    `topic-ratings:${user?.id ?? 'guest'}`,
    fetchTopicRatings,
  )
  const state = data ?? EMPTY

  async function vote(topicId: string, choice: 1 | -1): Promise<void> {
    const mine = state.my[topicId] ?? 0
    // Повторное нажатие того же — отмена: иначе оценку было бы не забрать.
    const next: TopicVoteValue = mine === choice ? 0 : choice
    const before = state.ratings.find((r) => r.topic_id === topicId) ?? emptyRating(topicId)
    const up = before.up - (mine === 1 ? 1 : 0) + (next === 1 ? 1 : 0)
    const down = before.down - (mine === -1 ? 1 : 0) + (next === -1 ? 1 : 0)
    // score оставляем прежним: его считает бот (одна формула на всех), а до
    // ответа сервера кнопка всё равно должна отреагировать мгновенно.
    const optimistic = { ...before, up, down, votes: up + down }

    await mutate(
      async () => {
        const res = await sendTopicVote(topicId, next)
        return withRating(state, res.rating, res.my_vote)
      },
      {
        optimisticData: withRating(state, optimistic, next),
        revalidate: false,
        rollbackOnError: true,
      },
    )
  }

  return {
    ratings: state.ratings,
    ratingFor: (topicId) => state.ratings.find((r) => r.topic_id === topicId) ?? emptyRating(topicId),
    myVote: (topicId) => state.my[topicId] ?? 0,
    minVotes: state.min_votes,
    canVote: Boolean(user),
    vote,
    loading: isLoading,
  }
}

/** «87% полезно» — доля положительных оценок для показа человеку. */
export function usefulPercent(rating: TopicRating): number {
  if (rating.votes <= 0) return 0
  return Math.round((rating.up / rating.votes) * 100)
}
