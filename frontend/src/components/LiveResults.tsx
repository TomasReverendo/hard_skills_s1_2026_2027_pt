// components/LiveResults.tsx — Resultados para o ANFITRIÃO (a qualquer momento).
// Layout do Figma: total grande à esquerda e uma linha por opção (A, B, C…) à direita.
import type { PollResults } from '../types'
import { letter, plural } from '../utils'

interface Props {
  results: PollResults
  live: boolean // true enquanto a votação está aberta e a atualizar sozinha
}

export default function LiveResults({ results, live }: Props) {
  return (
    <div className="live-results">
      <aside className="live-total">
        <p className="eyebrow">Total de votos</p>
        <p className="huge-number">{results.total_votes}</p>
        <p className="muted small">{live ? 'Atualização em tempo real' : 'Contagem final'}</p>
      </aside>

      <ul className="live-options">
        {results.options.map((option, index) => (
          <li key={option.id} className="live-option">
            <span className="letter-box">{letter(index)}</span>
            <div className="live-option-main">
              <span>{option.text}</span>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${option.percentage}%` }} />
              </div>
            </div>
            <span className="mono live-option-numbers">
              {plural(option.votes, 'voto', 'votos')} <span className="muted">({option.percentage}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
