import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CreatePollModal from '../components/CreatePollModal'
import Message from '../components/Message'
import StatusBadge from '../components/StatusBadge'
import { usePolling } from '../hooks/usePolling'
import { getHostPolls, updatePollStatus } from '../services/api'
import type { Poll } from '../types'
import { buttonPrimary, eyebrow, hostBackground, linkButton, page, pageTitle } from '../ui'
import { formatDate } from '../utils'

// Classes repetidas da tabela
const th = 'border-b border-line bg-soft px-4 py-3.5 text-left font-mono text-[0.65rem] font-normal uppercase text-muted'
const td = 'border-b border-line px-4 py-4 whitespace-nowrap'

export default function HostDashboard() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPolls = useCallback(async () => {
    try {
      setPolls(await getHostPolls())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  useEffect(() => {  // Carrega a lista uma vez quando a página abre e depois volta a carregar a cada 5 s 
    loadPolls()
  }, [loadPolls])

  // Nível 3: os totais de votos da tabela atualizam-se sozinhos a cada 5 s
  usePolling(loadPolls, 5000)

  async function openPoll(poll: Poll) {
    try {
      await updatePollStatus(poll.id, 'open')
      await loadPolls()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // Estatísticas do topo, calculadas a partir da lista
  const activeCount = polls.filter((p) => p.status === 'open').length
  const totalVotes = polls.reduce((sum, p) => sum + (p.total_votes ?? 0), 0)

  const stats = [
    { label: 'Total de votações', value: polls.length },
    { label: 'Ativa agora', value: activeCount },
    { label: 'Total de votos acumulados', value: totalVotes },
  ]

  return (
    <div className={hostBackground}>
      <main className={page}>
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className={eyebrow}>Painel geral</p>
            <h1 className={pageTitle}>Votações</h1>
          </div>
          <button className={buttonPrimary} onClick={() => setShowModal(true)}>
            + Criar votação
          </button>
        </div>

        <Message text={error} />

        {/* 3 caixas lado a lado no computador; divide-x desenha as linhas entre elas */}
        <div className="mb-7 grid divide-y divide-line border border-line bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-5">
              <p className="text-xs text-muted">{stat.label}</p>
              <p className="mt-1 font-mono text-[1.6rem]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* overflow-x-auto: em ecrãs pequenos a tabela desliza na horizontal */}
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className={th}>Pergunta</th>
                <th className={th}>Estado</th>
                <th className={th}>N.º opções</th>
                <th className={th}>Total votos</th>
                <th className={th}>Criada em</th>
                <th className={th}>Ações</th>
              </tr>
            </thead>
            {/* [&_tr:last-child_td]:border-b-0 = a última linha não tem borda em baixo */}
            <tbody className="[&_tr:last-child_td]:border-b-0">
              {polls.length === 0 && (
                <tr>
                  <td colSpan={6} className={`${td} text-muted`}>Ainda não há votações. Cria a primeira!</td>
                </tr>
              )}
              {polls.map((poll) => (
                <tr key={poll.id}>
                  <td className={`${td} min-w-[240px] whitespace-normal`}>{poll.question}</td>
                  <td className={td}><StatusBadge status={poll.status} /></td>
                  <td className={`${td} font-mono`}>{poll.options.length}</td>
                  <td className={`${td} font-mono`}>{poll.total_votes ?? 0}</td>
                  <td className={`${td} text-muted`}>{formatDate(poll.created_at)}</td>
                  <td className={td}>
                    {/* A ação muda consoante o estado da votação */}
                    {poll.status === 'draft' && (
                      <button className={linkButton} onClick={() => openPoll(poll)}>
                        Abrir para votação
                      </button>
                    )}
                    {poll.status === 'open' && (
                      <Link to={`/host/polls/${poll.id}`} className={`${linkButton} text-ok`}>
                        Ver direto / Fechar
                      </Link>
                    )}
                    {poll.status === 'closed' && (
                      <Link to={`/host/polls/${poll.id}`} className={linkButton}>Ver relatório</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* O modal só existe no ecrã quando showModal é true */}
        {showModal && (
          <CreatePollModal onClose={() => setShowModal(false)} onCreated={loadPolls} />
        )}
      </main>
    </div>
  )
}
