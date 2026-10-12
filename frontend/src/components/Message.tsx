// components/Message.tsx — Caixa de mensagem de erro (ou informação).
// Não mostra nada se `text` estiver vazio, por isso pode ser sempre renderizada.

interface Props {
  text: string | null
  type?: 'error' | 'info'
}

export default function Message({ text, type = 'error' }: Props) {
  if (!text) return null
  // role="alert" faz com que leitores de ecrã anunciem a mensagem
  return <p role="alert" className={`message message-${type}`}>{text}</p>
}
