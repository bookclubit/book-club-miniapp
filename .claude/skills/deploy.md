---
name: deploy
description: Билдит проект и деплоит на Vercel через npx vercel --prod
---

# deploy

Собирает проект и деплоит на Vercel.

## Шаги
1. Проверить сборку локально: `npm run build`.
2. Убедиться, что нет ошибок TypeScript и Vite.
3. Задеплоить в прод: `npx vercel --prod`.
   - При первом запуске Vercel CLI попросит войти и связать проект (интерактивно).
   - В CI использовать токен: `npx vercel --prod --token $VERCEL_TOKEN --yes`.

## Правила
- Не деплоить без успешного `npm run build`.
- Коммит с изменениями сделать до деплоя.
