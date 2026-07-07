# Book Club Mini App

## Назначение
Мини-приложение книжного клуба для фронтендеров на React. Данные подтягиваются из
GitHub-репозитория `book-club-data` (организация `bookclubit`) через `raw.githubusercontent.com`.

## Стек
- React 18, TypeScript, Vite
- Tailwind CSS v4 (конфигурация CSS-first через `@theme` в `src/index.css`, без `tailwind.config.js`)
- React Router v6 для навигации
- SWR для fetching и кеширования
- localStorage для хранения прогресса изучения (алгоритм SM-2)

## Структура
- `src/pages/` — страницы приложения (Home, Book, Chapter, Study)
- `src/lib/` — утилиты: `api.ts` (URL-хелперы + fetcher), `storage.ts` (SM-2 и прогресс)
- `src/types.ts` — общие типы
- `src/components/` — переиспользуемые компоненты

## Маршруты
- `/` — Home
- `/book/:bookId` — Book
- `/book/:bookId/chapter/:chapterId` — Chapter (`chapterId` = slug папки, напр. `01-vvedenie`)
- `/study/:bookId` — Study

## Источник данных
База: `https://raw.githubusercontent.com/bookclubit/book-club-data/main/`
- `books/{bookId}/meta.json`
- `books/{bookId}/chapters/{chapterSlug}/chapter.json`
- `books/{bookId}/flashcards.json`

В репозитории данных нет индекса глав, а `raw.githubusercontent.com` не умеет листать
директории. Поэтому список slug-ов глав для каждой книги хранится в `CHAPTER_SLUGS`
в `src/lib/api.ts`. При добавлении глав в данные — дополняй этот список.

## Правила
- Все новые компоненты — в отдельных файлах
- Типы выносить в `src/types.ts`
- Стили через Tailwind-классы, избегать инлайн-стилей
- Данные только через SWR, прямые `fetch` не использовать
- Обрабатывать состояния loading, error, empty
- Для иконок использовать эмодзи
- Компоненты экспортировать как default
- Перед коммитом проверять сборку: `npm run build`
- Коммиты по Conventional Commits: `тип(область): описание` (типы: feat, fix, docs, style, refactor, test, chore)
- Название (описание) коммита — на русском языке
