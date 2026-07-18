import useSWR from 'swr'
import { fetchSettings } from '../lib/api'
import { SOCIAL_PLATFORMS } from '../types'
import type { ClubSettings, SocialPlatform } from '../types'
import BrandIcon from './BrandIcon'

// Ряд ссылок на соцсети клуба. Список и URL приходят из settings.json (правит CMS);
// показываются только платформы с заданной ссылкой.
function SocialLinks() {
  const { data } = useSWR<ClubSettings>('settings', fetchSettings)
  const socials = data?.socials ?? {}

  const links = SOCIAL_PLATFORMS.map((p) => ({
    ...p,
    url: socials[p.id]?.trim(),
  })).filter((p): p is { id: SocialPlatform; label: string; url: string } =>
    Boolean(p.url),
  )

  if (links.length === 0) return null

  return (
    <div className="mt-7 flex items-center gap-5">
      {links.map((p) => (
        <a
          key={p.id}
          href={p.url}
          target="_blank"
          rel="noreferrer"
          aria-label={p.label}
          title={p.label}
          className="text-ink-faint transition-colors duration-200 hover:text-ink"
        >
          <BrandIcon brand={p.id} size={28} />
        </a>
      ))}
    </div>
  )
}

export default SocialLinks
