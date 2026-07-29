import { BRAND_PATHS } from './BrandIcon'

export type MaterialKind = 'youtube' | 'vk' | 'slides' | 'link'

export interface Material {
  kind: MaterialKind
  href: string
  /** Подпись: её читает скринридер и показывает подсказка при наведении. */
  label: string
}

/**
 * Глифы материалов: все залитые (fill), в одном визуальном весе с логотипами
 * YouTube и VK — контурная иконка рядом с ними смотрелась чужой.
 *
 * Размер у каждого свой: логотипы разной геометрии (широкий прямоугольник
 * YouTube против почти квадратного VK), и при одном числе VK выглядит крупнее
 * остальных. Числа подобраны так, чтобы иконки казались одинаковыми.
 */
const GLYPHS: Record<MaterialKind, { node: React.ReactNode; size: number }> = {
  youtube: { node: <path d={BRAND_PATHS.youtube} />, size: 18 },
  vk: { node: <path d={BRAND_PATHS.vk} />, size: 15 },
  // Экран на стойке — презентация доклада.
  slides: {
    node: (
      <>
        <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M11 18h2v1h4v2H7v-2h4Z" />
      </>
    ),
    size: 17,
  },
  // Стрелка из рамки — внешняя ссылка на доп. материал.
  link: {
    node: (
      <>
        <path d="M14 3h7v7h-2V6.4l-9.8 9.9-1.5-1.5L17.6 5H14Z" />
        <path d="M5 5h6v2H5v12h12v-6h2v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
      </>
    ),
    size: 16,
  },
}

/**
 * Материалы темы или доклада — иконками. Одни и те же ссылки показываются
 * и на странице главы, и в профиле спикера, поэтому набор иконок общий:
 * иначе один и тот же доклад выглядел бы в двух местах по-разному.
 */
function MaterialLinks({ items }: { items: Material[] }) {
  if (items.length === 0) return null

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {items.map((item) => {
        const glyph = GLYPHS[item.kind]
        return (
          <a
            key={`${item.kind}:${item.href}`}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            title={item.label}
            className="icon-link"
          >
            <svg
              aria-hidden="true"
              width={glyph.size}
              height={glyph.size}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              {glyph.node}
            </svg>
          </a>
        )
      })}
    </div>
  )
}

export default MaterialLinks
