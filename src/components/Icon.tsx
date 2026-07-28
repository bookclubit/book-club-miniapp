// Минимальный набор inline-SVG-иконок (stroke, 1.75px), 16–20px.
// Все иконки декоративные с точки зрения a11y: aria-hidden, смысл несёт текст рядом.

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'calendar'
  | 'play'
  | 'cards'
  | 'book'
  | 'external'
  | 'refresh'
  | 'check'
  | 'terminal'
  | 'file'
  | 'sun'
  | 'moon'
  | 'send'
  | 'home'
  | 'users'
  | 'mic'

const PATHS: Record<IconName, React.ReactNode> = {
  'arrow-left': <path d="M15.5 19 8 12l7.5-7" />,
  'arrow-right': <path d="M8.5 5l7.5 7-7.5 7" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 2.5V6M16 2.5V6" />
    </>
  ),
  play: <path d="M7 5.5v13l11-6.5z" />,
  cards: (
    <>
      <rect x="3" y="6.5" width="13" height="15" rx="2" />
      <path d="M8 3.5h11a2 2 0 0 1 2 2v12" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10.5 13.5" />
      <path d="M19 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 5v5h-5" />
      <path d="M20 10a8 8 0 1 0 1 4" />
    </>
  ),
  check: <path d="M4.5 12.5 10 18 19.5 6.5" />,
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="M7 9.5 10 12l-3 2.5M12.5 15H17" />
    </>
  ),
  file: (
    <>
      <path d="M6 2.5h8L19 8v13.5H6z" />
      <path d="M13.5 3v5.5H19" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" />
    </>
  ),
  moon: <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" />,
  home: (
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20v-1.2A4.3 4.3 0 0 1 7.8 14.5h2.4a4.3 4.3 0 0 1 4.3 4.3V20" />
      <path d="M15.6 5.1a3.2 3.2 0 0 1 0 5.8M16.8 14.6a4.3 4.3 0 0 1 3.7 4.2V20" />
    </>
  ),
  send: (
    <>
      <path d="M21 3.5 3 10.8l6.2 2.5L11.7 20z" />
      <path d="M21 3.5 9.2 13.3" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
    </>
  ),
}

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {PATHS[name]}
    </svg>
  )
}

export default Icon
