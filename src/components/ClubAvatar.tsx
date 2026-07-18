// Аватар клуба — плейсхолдер для свободной темы (никто не взял доклад).
// Знак меняется по теме теми же классами, что и логотип в шапке.
function ClubAvatar({ size = 32 }: { size?: number }) {
  const mark = Math.round(size * 0.6)
  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full border border-line bg-canvas"
      style={{ width: size, height: size }}
    >
      <img src="/logo-white.png" alt="" className="logo-mark-light" style={{ width: mark, height: mark }} />
      <img src="/logo-black.png" alt="" className="logo-mark-dark" style={{ width: mark, height: mark }} />
    </span>
  )
}

export default ClubAvatar
