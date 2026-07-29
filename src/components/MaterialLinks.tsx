import BrandIcon from './BrandIcon'
import Icon from './Icon'

export type MaterialKind = 'youtube' | 'vk' | 'slides' | 'link'

export interface Material {
  kind: MaterialKind
  href: string
  /** Подпись: её читает скринридер и показывает подсказка при наведении. */
  label: string
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
      {items.map((item) => (
        <a
          key={`${item.kind}:${item.href}`}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          title={item.label}
          className="icon-link"
        >
          {item.kind === 'youtube' || item.kind === 'vk' ? (
            <BrandIcon brand={item.kind} size={17} />
          ) : (
            <Icon name={item.kind === 'slides' ? 'file' : 'external'} size={16} />
          )}
        </a>
      ))}
    </div>
  )
}

export default MaterialLinks
