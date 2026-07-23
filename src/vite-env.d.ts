/// <reference types="vite/client" />

// Переменные окружения приложения (значения по умолчанию — в src/lib/api.ts,
// пример переопределения — в .env.example).
interface ImportMetaEnv {
  /** База контента book-club-data (raw.githubusercontent.com). */
  readonly VITE_RAW_BASE?: string
  /** HTTP API телеграм-бота (Cloudflare Workers). */
  readonly VITE_BOT_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
