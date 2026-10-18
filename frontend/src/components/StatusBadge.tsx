import type { PollStatus } from '../types'
import { square } from '../ui'

const LABELS: Record<PollStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberta',
  closed: 'Fechada',
}

// Cores de cada estado (classes do Tailwind; as cores ok/soft/muted estão no index.css)
const COLORS: Record<PollStatus, string> = {
  draft: 'bg-soft text-muted',
  open: 'bg-ok-bg text-ok',
  closed: 'bg-[#e9e9e9] text-[#444]',
}

export default function StatusBadge({ status }: { status: PollStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-[0.45rem] py-1 font-mono text-[0.62rem] uppercase ${COLORS[status]}`}
    >
      {/* As votações abertas levam um pequeno quadrado verde antes do texto (como no Figma) */}
      {status === 'open' && <span className={square} aria-hidden />}
      {LABELS[status]}
    </span>
  )
}
