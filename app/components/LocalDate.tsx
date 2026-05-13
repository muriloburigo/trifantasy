'use client'

export default function LocalDate({ dateStr, locale }: { dateStr: string; locale: string }) {
  const localeTag = locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US'
  return (
    <span>
      {new Date(dateStr).toLocaleString(localeTag, {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      })}
    </span>
  )
}
