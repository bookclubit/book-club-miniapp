import type { Flashcard } from '../types'

interface FlashCardProps {
  card: Flashcard
  flipped: boolean
  onFlip: () => void
}

const DIFFICULTY_LABEL: Record<Flashcard['difficulty'], string> = {
  easy: '🟢 легко',
  medium: '🟡 средне',
  hard: '🔴 сложно',
}

// Флип-карточка: клик переворачивает между вопросом/командой и ответом/результатом.
function FlashCard({ card, flipped, onFlip }: FlashCardProps) {
  const front = card.type === 'command' ? card.command : card.question
  const back = card.type === 'command' ? card.result : card.answer

  return (
    <button
      type="button"
      onClick={onFlip}
      className="card card-hover flex min-h-64 w-full flex-col items-center justify-center text-center"
    >
      <div className="mb-3 flex items-center gap-2 text-xs text-muted">
        <span>{card.type === 'command' ? '⌨️ команда' : '❓ вопрос'}</span>
        <span>·</span>
        <span>{DIFFICULTY_LABEL[card.difficulty]}</span>
      </div>

      {flipped ? (
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-primary">
            {card.type === 'command' ? 'Результат' : 'Ответ'}
          </p>
          <p className="text-base leading-relaxed text-slate-800">{back}</p>
        </div>
      ) : (
        <div>
          {card.type === 'command' ? (
            <code className="rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-slate-100">
              {front}
            </code>
          ) : (
            <p className="text-lg font-semibold text-slate-900">{front}</p>
          )}
        </div>
      )}

      <p className="mt-6 text-xs text-muted">👆 нажми, чтобы перевернуть</p>
    </button>
  )
}

export default FlashCard
