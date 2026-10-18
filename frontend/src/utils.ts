/** true se as duas datas forem no mesmo dia do calendário */
function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

/**
 * Formata a data como no protótipo Figma:
 *   hoje      -> "Hoje, 14:20"
 *   ontem     -> "Ontem, 16:45"
 *   outro dia -> "12 jun, 17:30"
 */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  if (sameDay(date, new Date())) return `Hoje, ${time}`
  if (sameDay(date, yesterday)) return `Ontem, ${time}`
  const day = date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }).replace('.', '')
  return `${day}, ${time}`
}

/** 1 -> "1 opção", 3 -> "3 opções" */
export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/** 0 -> "01", 1 -> "02" (numeração das opções) */
export function twoDigits(index: number): string {
  return String(index + 1).padStart(2, '0')
}

/** 0 -> "A", 1 -> "B" (letras das opções no painel do anfitrião) */
export function letter(index: number): string {
  return String.fromCharCode(65 + index) // 65 é o código de "A"
}
