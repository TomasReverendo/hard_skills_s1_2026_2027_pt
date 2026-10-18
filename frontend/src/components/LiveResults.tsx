// Resultados para o anfitrião (a qualquer momento, mesmo com a votação aberta).
// Layout do Figma: total grande à esquerda e uma linha por opção (A, B, C…) à direita.
import type { PollResults } from '../types'
import { bar, barFill, eyebrow } from '../ui'
import { letter, plural } from '../utils'

interface Props {
  results: PollResults
  live: boolean // true enquanto a votação está aberta e a atualizar sozinha
}

export default function LiveResults({ results, live }: Props) {
  return (
    // No telemóvel fica tudo empilhado; no computador, 2 colunas (215px | resto)
    <div className="grid md:grid-cols-[215px_1fr]">
      <aside className="border-b border-line px-6 py-7 md:border-b-0 md:border-r">
        <p className={eyebrow}>Total de votos</p>
        <p className="my-1.5 font-mono text-[3.5rem] leading-tight">{results.total_votes}</p>
        <p className="text-xs text-muted">{live ? 'Atualização em tempo real' : 'Contagem final'}</p>
      </aside>

      <ul className="flex flex-col gap-2.5 p-4 md:p-7">
        {results.options.map((option, index) => (
          <li key={option.id} className="flex items-center gap-3 border border-line px-4 py-3.5 md:gap-6">
            <span className="grid h-7 w-7 shrink-0 place-items-center bg-soft text-xs">{letter(index)}</span>
            <div className="flex flex-1 flex-col gap-2 text-[0.9rem]">
              <span>{option.text}</span>
              <div className={bar}>
                <div className={barFill} style={{ width: `${option.percentage}%` }} />
              </div>
            </div>
            <span className="whitespace-nowrap font-mono text-[0.8rem]">
              {plural(option.votes, 'voto', 'votos')} <span className="text-muted">({option.percentage}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
