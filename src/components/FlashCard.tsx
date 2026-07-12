import type { Flashcard } from '../types'

interface FlashCardProps {
  card: Flashcard
  flipped: boolean
  onFlip: () => void
}

const DIFFICULTY: Record<Flashcard['difficulty'], { label: string; className: string }> = {
  easy: { label: 'легко', className: 'bg-success-soft text-success' },
  medium: { label: 'средне', className: 'bg-warn-soft text-warn' },
  hard: { label: 'сложно', className: 'bg-danger-soft text-danger' },
}

// Одна сторона карточки: шапка с типом/сложностью + содержимое по центру.
function Face({
  card,
  side,
  children,
}: {
  card: Flashcard
  side: 'front' | 'back'
  children: React.ReactNode
}) {
  const difficulty = DIFFICULTY[card.difficulty]
  return (
    <div
      className={`flip-face ${side === 'back' ? 'flip-face-back' : ''} card flex min-h-72 flex-col p-6`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-[0.12em] text-ink-faint">
          {card.type === 'command' ? 'Команда' : 'Вопрос'}
          {side === 'back' ? (card.type === 'command' ? ' · результат' : ' · ответ') : ''}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${difficulty.className}`}>
          {difficulty.label}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center py-6 text-center">
        {children}
      </div>

      <p className="text-center text-xs text-ink-faint">
        {side === 'front' ? 'Нажми, чтобы перевернуть' : 'Оцени, насколько легко вспомнил'}
      </p>
    </div>
  )
}

// Флип-карточка с 3D-переворотом: клик переворачивает между
// вопросом/командой и ответом/результатом.
function FlashCard({ card, flipped, onFlip }: FlashCardProps) {
  const front = card.type === 'command' ? card.command : card.question
  const back = card.type === 'command' ? card.result : card.answer

  return (
    <button
      type="button"
      onClick={onFlip}
      aria-pressed={flipped}
      className="flip-scene block w-full cursor-pointer text-left"
    >
      <div className={`flip-inner ${flipped ? 'flipped' : ''}`}>
        <Face card={card} side="front">
          {card.type === 'command' ? (
            <code className="rounded-btn bg-terminal px-4 py-3 font-mono text-sm leading-relaxed text-terminal-ink">
              {front}
            </code>
          ) : (
            <p className="font-display text-xl font-semibold leading-snug text-ink">
              {front}
            </p>
          )}
        </Face>

        <Face card={card} side="back">
          <p className="max-w-prose text-[15px] leading-relaxed text-ink-soft">{back}</p>
        </Face>
      </div>
    </button>
  )
}

export default FlashCard
