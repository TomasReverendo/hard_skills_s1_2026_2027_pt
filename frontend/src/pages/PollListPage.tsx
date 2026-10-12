// pages/PollListPage.tsx — Página inicial do público: lista de votações Abertas e Fechadas.
// (Os Rascunhos nunca chegam aqui: o backend já os filtra.)
import { useCallback, useEffect, useState } from 'react'
import Message from '../components/Message'
import PollCard from '../components/PollCard'
import { usePolling } from '../hooks/usePolling'
import { getPublicPolls } from '../services/api'
import type { Poll } from '../types'
import { plural } from '../utils'

type Filter = 'open' | 'closed'

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
    <main className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Evento / Sessão principal</p>
          <h1>Votações do evento</h1>
        </div>
        <button className="btn" onClick={loadPolls}>↻ Atualizar</button>
      </div>

      <div className="layout-sidebar">
        {/* Filtro lateral: Abertas / Fechadas, com contadores */}
        <aside className="filters">
          <p className="eyebrow">Filtrar votações</p>
          <button
            className={filter === 'open' ? 'filter active' : 'filter'}
            onClick={() => setFilter('open')}
          >
            Abertas <span className="mono">{openPolls.length}</span>
          </button>
          <button
            className={filter === 'closed' ? 'filter active' : 'filter'}
            onClick={() => setFilter('closed')}
          >
            Fechadas <span className="mono">{closedPolls.length}</span>
          </button>
        </aside>

        <section>
          <div className="section-header">
            <h2>{filter === 'open' ? 'Votações abertas' : 'Arquivo'}</h2>
            <span className="eyebrow">{plural(visible.length, 'resultado', 'resultados')}</span>
          </div>

          <Message text={error} />
          {loading && <p className="muted">A carregar…</p>}
          {!loading && visible.length === 0 && (
            <p className="empty">
              {filter === 'open' ? 'Não há votações abertas de momento.' : 'Ainda não há votações fechadas.'}
            </p>
          )}

          <div className="card-grid">
            {visible.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
