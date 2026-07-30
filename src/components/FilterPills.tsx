import { useEffect, useRef, useState } from 'react'
import Pill from './Pill'

export interface FilterOption {
  id: string
  label: string
}

const GAP = 8 // gap-2 между «таблетками» — нужен при подсчёте влезающих

/**
 * Ряд фильтров-«таблеток» в одну строку: что не влезло — под кнопкой «…».
 *
 * Значений бывает много (годы архива, книги клуба), а перенос на вторую-третью
 * строку съедал экран до первой встречи. Поэтому строка одна, а порядок
 * `options` задаёт важность: первыми то, что должно остаться на виду
 * (свежие годы, книги, которые читаем сейчас).
 *
 * Сколько влезает — считаем по факту, а не по числу значений: подписи разной
 * длины, экраны тоже. Ширины берём со скрытого ряда-эталона (в нём всегда все
 * значения), пересчитываем при изменении ширины и после загрузки шрифтов.
 */
function FilterPills({
  allLabel,
  options,
  active,
  onSelect,
  label,
}: {
  allLabel: string
  options: FilterOption[]
  /** 'all' или id значения. */
  active: string
  onSelect: (id: string) => void
  label: string
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(options.length)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const row = rowRef.current
    const probe = probeRef.current
    if (!row || !probe) return

    const recount = () => {
      const kids = Array.from(probe.children) as HTMLElement[]
      if (kids.length < 2) return
      const width = row.clientWidth
      const dots = kids[kids.length - 1].offsetWidth
      const chips = kids.slice(1, -1).map((k) => k.offsetWidth)
      let used = kids[0].offsetWidth // «Все …» — всегда в строке
      let n = 0
      for (const [i, w] of chips.entries()) {
        // Если после этого значения что-то останется, место под «…» нужно.
        const reserve = i + 1 < chips.length ? GAP + dots : 0
        if (used + GAP + w + reserve > width) break
        used += GAP + w
        n += 1
      }
      setFit(n)
    }

    recount()
    const observer = new ResizeObserver(recount)
    observer.observe(row)
    observer.observe(probe) // ширины меняются, когда подгрузился шрифт
    return () => observer.disconnect()
  }, [options])

  // Выбранное значение всегда на виду, даже если по ширине оно в скрытых:
  // иначе фильтр выглядит как «Все книги» при активном фильтре.
  const shown = options.slice(0, fit)
  const rest = options.slice(fit)
  const activeHidden = rest.find((o) => o.id === active)
  const visible = activeHidden
    ? [...shown.slice(0, Math.max(0, shown.length - 1)), activeHidden]
    : shown
  const hidden = options.filter((o) => !visible.some((v) => v.id === o.id))

  const chip = (option: FilterOption) => (
    <Pill
      key={option.id}
      size="sm"
      active={active === option.id}
      onClick={() => {
        onSelect(option.id)
        setOpen(false)
      }}
    >
      {option.label}
    </Pill>
  )

  return (
    <div className="relative" role="group" aria-label={label}>
      <div ref={rowRef} className="flex gap-2 overflow-hidden">
        <Pill size="sm" active={active === 'all'} onClick={() => onSelect('all')}>
          {allLabel}
        </Pill>
        {visible.map(chip)}
        {hidden.length > 0 ? (
          <Pill size="sm" active={open} onClick={() => setOpen((v) => !v)}>
            <span aria-hidden="true">…</span>
            <span className="sr-only">Ещё значения: {label}</span>
          </Pill>
        ) : null}
      </div>

      {open && hidden.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">{hidden.map(chip)}</div>
      ) : null}

      {/* Ряд-эталон для замера: не видим, из потока выведен, но размеры настоящие. */}
      <div
        ref={probeRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex gap-2"
      >
        <Pill size="sm" active={false} onClick={() => {}}>
          {allLabel}
        </Pill>
        {options.map((option) => (
          <Pill key={option.id} size="sm" active={false} onClick={() => {}}>
            {option.label}
          </Pill>
        ))}
        <Pill size="sm" active={false} onClick={() => {}}>
          …
        </Pill>
      </div>
    </div>
  )
}

export default FilterPills
