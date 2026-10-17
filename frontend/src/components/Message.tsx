// components/Message.tsx: Caixa de mensagem de erro (ou informação).
// Não mostra nada se `text` estiver vazio, por isso pode ser sempre renderizada.

interface Props {
  text: string | null
  type?: 'error' | 'info'
}

const COLORS = {
  error: 'border-danger bg-danger-bg text-danger',
  info: 'border-ink bg-soft text-ink',
}

export default function Message({ text, type = 'error' }: Props) {
  if (!text) return null
  // role="alert" faz com que leitores de ecrã anunciem a mensagem
  return (
    <p role="alert" className={`mt-3 border-l-2 px-3.5 py-3 text-sm ${COLORS[type]}`}>
      {text}
    </p>
  )
}
