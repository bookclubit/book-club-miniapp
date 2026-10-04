import { useState } from 'react'
import Icon from './Icon'
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

// Одна сторона карточки: шапка с типом/сложностью + содержимое. Текст — по
// левому краю: ответ в несколько строк по центру читается рваными строками.
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

      <div className="flex flex-1 items-center py-6">{children}</div>

      <p className="text-xs text-ink-faint">
        {side === 'front' ? 'Нажми, чтобы перевернуть' : 'Оцени, насколько легко вспомнил'}
      </p>
    </div>
  )
}

// Флип-карточка с 3D-переворотом: клик переворачивает между
// вопросом/командой и ответом/результатом.
//
// Корень — div с role="button", а не <button>: на обратной стороне живёт
// кнопка «Объяснение», а кнопку в кнопку вкладывать нельзя.
function FlashCard({ card, flipped, onFlip }: FlashCardProps) {
  const front = card.type === 'command' ? card.command : card.question
  const back = card.type === 'command' ? card.result : card.answer
  const example = card.example?.trim()
  const isNote = card.example_kind === 'note'
  // Раскрытое объяснение помним по id карточки: следующая приходит свёрнутой.
  const [openFor, setOpenFor] = useState<string | null>(null)
  const noteOpen = openFor === card.id

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onClick={onFlip}
      onKeyDown={(e) => {
        // Клавиши с кнопки «Объяснение» всплывают сюда — их не трогаем.
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFlip()
        }
      }}
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
          <div className="w-full max-w-prose">
            <p className="text-[15px] leading-relaxed text-ink-soft">{back}</p>
            {example && isNote ? (
              // Пояснение — не часть ответа: прячем под кнопку, чтобы сначала
              // вспомнить самому. По нажатию карточка раздвигается.
              <div className="mt-4">
                <button
                  type="button"
                  aria-expanded={noteOpen}
                  tabIndex={flipped ? 0 : -1}
                  onClick={(e) => {
                    e.stopPropagation()
                    setOpenFor(noteOpen ? null : card.id)
                  }}
                  className="inline-flex items-center gap-1.5 rounded-btn border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors duration-200 hover:border-line-strong hover:text-ink"
                >
                  Объяснение
                  <Icon
                    name="chevron"
                    size={14}
                    className={`transition-transform duration-200 ${noteOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className={`expand ${noteOpen ? 'open' : ''}`}>
                  <div className="overflow-hidden">
                    <p className="whitespace-pre-wrap pt-3 text-sm leading-relaxed text-ink-soft">
                      {example}
                    </p>
                  </div>
                </div>
              </div>
            ) : example ? (
              // Пример кода виден сразу: моноширинный, чтобы код и вывод
              // команды читались как код.
              <div className="mt-4 rounded-btn border border-line bg-canvas px-3.5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Пример
                </p>
                <p className="mt-1.5 whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-ink-soft">
                  {example}
                </p>
              </div>
            ) : null}
          </div>
        </Face>
      </div>
    </div>
  )
}

export default FlashCard
