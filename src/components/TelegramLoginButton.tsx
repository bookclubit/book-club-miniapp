import { useEffect, useRef } from 'react'
import type { TelegramWidgetUser } from '../lib/account'

// Официальный Telegram Login Widget для входа в браузере. Требует, чтобы у бота
// в @BotFather был задан домен (/setdomain → book-club-miniapp.vercel.app).
const BOT_USERNAME = 'bookclubfrontbot'

function TelegramLoginButton({ onAuth }: { onAuth: (user: TelegramWidgetUser) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.onTelegramAuth = (user) => onAuth(user)

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '10')
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')

    const el = ref.current
    el?.appendChild(script)
    return () => {
      if (el) el.innerHTML = ''
    }
  }, [onAuth])

  return <div ref={ref} />
}

export default TelegramLoginButton
