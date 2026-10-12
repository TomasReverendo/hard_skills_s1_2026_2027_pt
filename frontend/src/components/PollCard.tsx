// components/PollCard.tsx — Cartão de uma votação na lista do público.
// O cartão inteiro é um link; o "botão" do rodapé é só visual.
import { Link } from 'react-router-dom'
import type { Poll } from '../types'
import { formatDate, plural } from '../utils'
import StatusBadge from './StatusBadge'

export default function PollCard({ poll }: { poll: Poll }) {
  const isOpen = poll.status === 'open'

  return (
    <Link to={`/polls/${poll.id}`} className="poll-card">
      <div className="poll-card-body">
        <StatusBadge status={poll.status} />
        <h3>{poll.question}</h3>
        <p className="meta">
          {plural(poll.options.length, 'opção', 'opções')} · {formatDate(poll.created_at)}
        </p>
      </div>
      {/* Aberta: botão preto "Votar". Fechada: botão branco "Ver resultados". */}
      <span className={isOpen ? 'poll-card-footer dark' : 'poll-card-footer'}>
        {isOpen ? 'Votar' : 'Ver resultados'}
      </span>
    </Link>
  )
}
