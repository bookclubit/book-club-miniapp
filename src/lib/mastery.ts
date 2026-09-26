// Части полосы освоения книги — общие для полосы (BookMastery) и её легенды
// в профиле: цвет части и подпись в легенде не должны разойтись.
// «Новые» — остаток полосы, её фон.
export const MASTERY_PARTS = [
  { key: 'mature', label: 'выучено', className: 'bg-success' },
  { key: 'learning', label: 'изучаю', className: 'bg-accent' },
  { key: 'fresh', label: 'новые', className: 'bg-line-strong' },
] as const
