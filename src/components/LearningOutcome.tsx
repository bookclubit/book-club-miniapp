// Блок «Чему научишься» для главы. learning_outcome хранится как список
// (по пункту на строку, обычно с маркером «- ») — показываем именно списком,
// чтобы можно было быстро просмотреть. Одна строка без списка — абзацем.
function parseOutcomes(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
    .filter(Boolean)
}

function LearningOutcome({ text }: { text: string }) {
  const items = parseOutcomes(text)
  if (items.length === 0) return null

  return (
    <div className="mt-5 rounded-card bg-accent-soft px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent-strong">
        Чему научишься
      </p>
      {items.length > 1 ? (
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-sm leading-relaxed text-ink">{items[0]}</p>
      )}
    </div>
  )
}

export default LearningOutcome
