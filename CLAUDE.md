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
- `src/lib/` — утилиты: `api.ts` (URL-хелперы + fetcher), `format.ts` (плюрализация, даты), `storage.ts` (SM-2 и прогресс)
- `src/types.ts` — общие типы
- `src/components/` — переиспользуемые компоненты (`Icon.tsx` — единственный источник иконок)

## Маршруты
- `/` — Home (книги со статусом `reading` + встречи)
- `/books` — Books (все книги с прогрессом чтения)
- `/book/:bookId` — Book (`bookId` = имя папки книги, напр. `docker-up-and-running`)
- `/book/:bookId/chapter/:chapterId` — Chapter (`chapterId` = slug папки, напр. `01-vvedenie`; темы главы рендерятся здесь же)
- `/study` — StudyIndex (выбор книги для повторения; показываются только книги с карточками)
- `/study/:bookId` — Study
- `/join` — BecomeSpeaker: «Стать спикером» целиком в приложении. Требует входа
  через Telegram. Участнику клуба показывает свободные темы плана с кнопкой
  «Взять тему» (`POST /api/claim` бота), новому человеку — форму заявки на
  участие (имя + рассказ о себе, `POST /api/membership`). Состояние общее
  с ботом (D1), поэтому продолжить можно где удобно

## Источник данных
База: `https://raw.githubusercontent.com/bookclubit/book-club-data/main/`
- `books/{folder}/meta.json` — мета книги; `authors` — объекты `{name, avatar}`; `id` в meta может отличаться от имени папки, маршруты строятся по имени папки
- `books/{folder}/chapters/{chapterSlug}/chapter.json` — глава целиком, вместе с темами:
  `topics: [{id, title, speakers[], video_youtube, video_vk, presentation, resources[]}]`.
  У темы нет ни отдельного файла, ни текста: в UI это название, иконка с именем
  спикера и ссылки на материалы (`components/TopicSection.tsx`)
- `books/{folder}/flashcards.json` — карточки (может отсутствовать — тогда 404 трактуется как пустой список)
- `events/closed-chapters/*.json` и `events/live-talks/*.json` — встречи клуба
- Пути к изображениям в данных относительные (`/media/...`) — оборачивать в `mediaUrl()` из `api.ts`

`raw.githubusercontent.com` не умеет листать директории, поэтому список книг
(с главами), событий и спикеров приложение берёт из единого реестра
`index.json` в корне book-club-data (`fetchIndex()` в `api.ts`, кэш на сессию).
Реестр генерируется Action-ом в book-club-data после каждого мержа — контент,
добавленный через CMS, появляется в miniapp без правок кода.

В реестре (`version: 2`) главы книги — объекты `{slug, order, title, topics}`,
где `topics` — число тем. Попадают **все** главы с `chapter.json`, включая
пустые заготовки: глава видна сразу после создания.

Прогресс чтения книги (`readingProgress` в `api.ts`) считается как доля
разобранных глав (`topics > 0`) от `total_chapters` из meta.

**Доклады спикера — из двух источников** (`collectSpeakerTalks` в
`lib/speakers.ts`), иначе профиль расходится со страницей книги:

- заявки в D1 (`/api/claims`) — свежие брони: слайды из заявки, монтажный ролик
  из `event.recordings`, статус «заявка» до подтверждения админом;
- темы глав из `chapter.json` (`fetchAllChapters`, ключ SWR `chapters-all`) —
  так записаны все прошлые доклады: спикер в `topic.speakers` (по имени или
  алиасу), ссылки в самой теме. Событий за старые главы в клубе не заводили,
  поэтому у таких докладов **нет даты** — они идут после датированных, по номеру
  главы, и в карточке подписаны «Глава N».

Тема, попавшая в оба источника, показывается одной карточкой (ключ — `topic.id`):
ссылки из данных клуба дополняют заявку. Доклад виден, только если он состоялся:
есть материалы либо встреча прошла. Список спикеров считает доклады тем же
`collectSpeakerTalks` — счётчик на карточке не должен расходиться с профилем.

## Телеграм-бот
Бот клуба — `@bookclubfrontbot` (репозиторий `book-club-bot`, Cloudflare Workers).
Заявка на участие и выбор темы доклада живут в приложении (`/join`) — в бота
не перекидываем; `speakerUrl()` остаётся вторичной ссылкой «то же самое в боте».

**Темы докладов берут только участники клуба.** Кто участник, решает бот
(`GET /api/membership`): каталог `speakers.json` по Telegram-нику или одобренная
админом заявка. Новый человек может ходить на встречи и учить карточки сразу,
а темы открываются после одобрения заявки.

## Дизайн-система
- Токены только в `@theme` в `src/index.css`: цвета в oklch (тёплая «бумажная» палитра), радиусы `rounded-card`/`rounded-btn`, тени `shadow-card`/`shadow-lift`
- Две темы: светлая (по умолчанию) и тёмная — переопределение токенов под `[data-theme="dark"]` в `index.css`; переключатель `components/ThemeToggle.tsx`, выбор в `localStorage('theme')`, инит-скрипт против мигания — в `index.html`. Новые цвета добавлять сразу в обе темы
- Текст на акцентном фоне — токен `on-accent` (не `text-white`); блоки кода — токены `terminal`/`terminal-ink` (тёмные в обеих темах)
- Один акцентный цвет — терракота (`accent`); семантические `success`/`warn`/`danger` с мягкими `-soft`-фонами
- Шрифты: `font-display` (Source Serif 4) для заголовков и названий, Golos Text — текст и UI; подключены в `index.html`
- Иконки — только inline-SVG через `components/Icon.tsx`; эмодзи в UI не использовать
- Анимации: каскадное появление через класс `.reveal` и CSS-переменную `--reveal-delay`; hover-переходы 0.2–0.3s; обязательно уважать `prefers-reduced-motion` (уже в `index.css`)
- Не использовать произвольные значения (`rounded-[14px]`, `p-[17px]`) — только классы из токенов и шкалы Tailwind
- Обязательные состояния интерактивных элементов: hover, focus-visible (глобальный стиль в `index.css`), active, disabled
- Один основной CTA на экран

## Правила
- Все новые компоненты — в отдельных файлах
- Типы выносить в `src/types.ts`
- Стили через Tailwind-классы, избегать инлайн-стилей (исключение — `--reveal-delay`)
- Данные только через SWR, прямые `fetch` не использовать (fetch-хелперы живут в `api.ts`)
- Обрабатывать состояния loading, error, empty
- Компоненты экспортировать как default
- Перед коммитом проверять сборку: `npm run build`
- Коммиты по Conventional Commits: `тип(область): описание` (типы: feat, fix, docs, style, refactor, test, chore)
- Название (описание) коммита — на русском языке
