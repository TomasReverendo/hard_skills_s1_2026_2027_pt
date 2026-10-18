// O cartão inteiro é um link; o "botão" do rodapé é só visual.
import { Link } from 'react-router-dom'
import type { Poll } from '../types'
import { meta } from '../ui'
import { formatDate, plural } from '../utils'
import StatusBadge from './StatusBadge'

export default function PollCard({ poll }: { poll: Poll }) {
  const isOpen = poll.status === 'open'

  return (
    <Link
      to={`/polls/${poll.id}`}
      className="flex flex-col border border-line bg-white transition-colors hover:border-ink"
    >
      <div className="flex-1 px-[1.1rem] pb-[1.1rem] pt-4">
        <StatusBadge status={poll.status} />
        <h3 className="mb-2.5 mt-4 text-base font-medium">{poll.question}</h3>
        <p className={meta}>
          {plural(poll.options.length, 'opção', 'opções')} · {formatDate(poll.created_at)}
        </p>
      </div>
      {/* Aberta: botão preto "Votar". Fechada: botão branco "Ver resultados". */}
      <span
        className={
          isOpen
            ? 'border-t border-ink bg-ink p-3 text-center text-sm font-medium text-white'
            : 'border-t border-line p-3 text-center text-sm font-medium'
        }
      >
        {isOpen ? 'Votar' : 'Ver resultados'}
      </span>
    </Link>
  )
}
