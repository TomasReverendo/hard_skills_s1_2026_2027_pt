// Página inicial do público: lista de votações Abertas e Fechadas.
// (Os Rascunhos nunca chegam aqui: o backend já os filtra.)
import { useCallback, useEffect, useState } from 'react'
import Message from '../components/Message'
import PollCard from '../components/PollCard'
import { usePolling } from '../hooks/usePolling'
import { getPublicPolls } from '../services/api'
import type { Poll } from '../types'
import { button, eyebrow, page, pageTitle } from '../ui'
import { plural } from '../utils'

type Filter = 'open' | 'closed'

// Classes de um botão do filtro lateral (o ativo tem fundo cinzento e linha preta)
function filterClass(active: boolean) {
  const base =
    'flex flex-1 cursor-pointer justify-between border-b-2 px-3 py-2.5 text-left text-[0.9rem] md:flex-none md:border-b-0 md:border-l-2'
  return active
    ? `${base} border-ink bg-soft font-semibold text-ink`
    : `${base} border-transparent text-muted`
}

export default function PollListPage() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [filter, setFilter] = useState<Filter>('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // useCallback mantém a mesma função entre renders (usada no useEffect e no polling)
  const loadPolls = useCallback(async () => {
    try {
      setPolls(await getPublicPolls())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carrega a lista uma vez quando a página abre...
  useEffect(() => {
    loadPolls()
  }, [loadPolls])

  // ...e volta a carregar a cada 5 s (Nível 3: novas votações aparecem sozinhas)
  usePolling(loadPolls, 5000)

  const openPolls = polls.filter((p) => p.status === 'open')
  const closedPolls = polls.filter((p) => p.status === 'closed')
  const visible = filter === 'open' ? openPolls : closedPolls

  return (
    <main className={page}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className={eyebrow}>Evento / Sessão principal</p>
          <h1 className={pageTitle}>Votações do evento</h1>
        </div>
        <button className={button} onClick={loadPolls}>↻ Atualizar</button>
      </div>

      {/* Telemóvel: tudo empilhado. Computador: filtro (185px) à esquerda + lista */}
      <div className="grid gap-5 md:grid-cols-[185px_1fr] md:gap-8">
        {/* Filtro lateral: Abertas / Fechadas, com contadores */}
        <aside className="flex flex-row flex-wrap md:flex-col">
          <p className={`${eyebrow} w-full`}>Filtrar votações</p>
          <button className={filterClass(filter === 'open')} onClick={() => setFilter('open')}>
            Abertas <span className="font-mono">{openPolls.length}</span>
          </button>
          <button className={filterClass(filter === 'closed')} onClick={() => setFilter('closed')}>
            Fechadas <span className="font-mono">{closedPolls.length}</span>
          </button>
        </aside>

        <section>
          <div className="mb-3.5 flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-[0.9rem] font-medium">{filter === 'open' ? 'Votações abertas' : 'Arquivo'}</h2>
            <span className="font-mono text-[0.68rem] uppercase tracking-wide text-muted">
              {plural(visible.length, 'resultado', 'resultados')}
            </span>
          </div>

          <Message text={error} />
          {loading && <p className="text-muted">A carregar…</p>}
          {!loading && visible.length === 0 && (
            <p className="border border-dashed border-line p-8 text-center text-muted">
              {filter === 'open' ? 'Não há votações abertas de momento.' : 'Ainda não há votações fechadas.'}
            </p>
          )}

          {/* Cartões: 1 coluna no telemóvel, 2 no computador */}
          <div className="grid gap-3.5 md:grid-cols-2">
            {visible.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
