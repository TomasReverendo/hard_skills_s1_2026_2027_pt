// components/ResultsList.tsx — Resultados finais para o PÚBLICO (votação fechada).
// Layout do Figma: "TOTAL APURADO" em cima e uma barra por opção, com a vencedora destacada.
// A "barra" é só uma <div> com largura = percentagem; não precisa de biblioteca de gráficos.
import type { PollResults } from '../types'
import { plural } from '../utils'

export default function ResultsList({ results }: { results: PollResults }) {
  // A opção com mais votos é a vencedora (só se houver pelo menos 1 voto)
  const maxVotes = Math.max(...results.options.map((o) => o.votes))

  return (
    <div className="results">
      <div className="results-total">
        <p className="eyebrow">Total apurado</p>
        <p className="big-number">{plural(results.total_votes, 'voto', 'votos')}</p>
      </div>

      <ul>
        {results.options.map((option) => {
          const isWinner = maxVotes > 0 && option.votes === maxVotes
          return (
            <li key={option.id} className={isWinner ? 'result winner' : 'result'}>
              {isWinner && <p className="eyebrow winner-label">★ Vencedora</p>}
              <div className="result-row">
                <span>{option.text}</span>
                <span className="mono">
                  {plural(option.votes, 'voto', 'votos')} — {option.percentage}%
                </span>
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${option.percentage}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
