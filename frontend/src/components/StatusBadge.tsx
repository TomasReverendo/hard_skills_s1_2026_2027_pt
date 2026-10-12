// components/StatusBadge.tsx — Etiqueta com o estado da votação (Rascunho / Aberta / Fechada).
import type { PollStatus } from '../types'

const LABELS: Record<PollStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  closed: 'Fechada',
}

export default function StatusBadge({ status }: { status: PollStatus }) {
  // a classe "badge-open", "badge-closed"... define a cor no CSS.
  // As votações abertas levam um pequeno quadrado verde antes do texto (como no Figma).
  return (
    <span className={`badge badge-${status}`}>
      {status === 'open' && <span className="square" aria-hidden />}
      {LABELS[status]}
    </span>
  )
}
