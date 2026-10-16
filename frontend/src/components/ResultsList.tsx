// components/ResultsList.tsx — Resultados finais para o PÚBLICO (votação fechada).
// Layout do Figma: "TOTAL APURADO" em cima e uma barra por opção, com a vencedora destacada.
// A "barra" é só uma <div> com largura = percentagem; não precisa de biblioteca de gráficos.
import type { PollResults } from '../types'
import { bar, barFill, eyebrow } from '../ui'
import { plural } from '../utils'

export default function ResultsList({ results }: { results: PollResults }) {
  // A opção com mais votos é a vencedora (só se houver pelo menos 1 voto)
  const maxVotes = Math.max(...results.options.map((o) => o.votes))

  return (
    <div>
      <div className="mb-6 mt-5 border-y border-line py-5">
        <p className={eyebrow}>Total apurado</p>
        <p className="mt-1 font-mono text-[1.6rem]">{plural(results.total_votes, 'voto', 'votos')}</p>
      </div>

      <ul className="flex flex-col gap-6">
        {results.options.map((option) => {
          const isWinner = maxVotes > 0 && option.votes === maxVotes
          return (
            // A vencedora tem uma linha preta à esquerda
            <li key={option.id} className={isWinner ? 'border-l-2 border-ink pl-3' : ''}>
              {isWinner && (
                <p className="mb-1.5 font-mono text-[0.68rem] font-bold uppercase tracking-wide">★ Vencedora</p>
              )}
              <div className="mb-1.5 flex justify-between gap-4 text-[0.9rem]">
                <span>{option.text}</span>
                <span className="font-mono text-xs">
                  {plural(option.votes, 'voto', 'votos')} — {option.percentage}%
                </span>
              </div>
              <div className={bar}>
                {/* style inline porque a largura muda com os dados */}
                <div className={barFill} style={{ width: `${option.percentage}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
