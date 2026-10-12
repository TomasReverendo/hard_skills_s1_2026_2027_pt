// pages/HostDashboard.tsx — Painel do anfitrião: estatísticas, tabela de votações e criação.
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CreatePollModal from '../components/CreatePollModal'
import Message from '../components/Message'
import StatusBadge from '../components/StatusBadge'
import { usePolling } from '../hooks/usePolling'
import { getHostPolls, updatePollStatus } from '../services/api'
import type { Poll } from '../types'
import { formatDate } from '../utils'

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

  useEffect(() => {
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

  return (
    <main className="page host-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Painel geral</p>
          <h1>Votações</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Criar votação
        </button>
      </div>

      <Message text={error} />

      <div className="stats">
        <div className="stat">
          <p className="muted small">Total de votações</p>
          <p className="big-number">{polls.length}</p>
        </div>
        <div className="stat">
          <p className="muted small">Ativa agora</p>
          <p className="big-number">{activeCount}</p>
        </div>
        <div className="stat">
          <p className="muted small">Total de votos acumulados</p>
          <p className="big-number">{totalVotes}</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Pergunta</th>
              <th>Estado</th>
              <th>N.º opções</th>
              <th>Total votos</th>
              <th>Criada em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {polls.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">Ainda não há votações. Cria a primeira!</td>
              </tr>
            )}
            {polls.map((poll) => (
              <tr key={poll.id}>
                <td>{poll.question}</td>
                <td><StatusBadge status={poll.status} /></td>
                <td className="mono">{poll.options.length}</td>
                <td className="mono">{poll.total_votes ?? 0}</td>
                <td className="muted">{formatDate(poll.created_at)}</td>
                <td>
                  {/* A ação muda consoante o estado da votação */}
                  {poll.status === 'draft' && (
                    <button className="link-btn" onClick={() => openPoll(poll)}>
                      Abrir para votação
                    </button>
                  )}
                  {poll.status === 'open' && (
                    <Link to={`/host/polls/${poll.id}`} className="link-btn green">
                      Ver direto / Fechar
                    </Link>
                  )}
                  {poll.status === 'closed' && (
                    <Link to={`/host/polls/${poll.id}`} className="link-btn">Ver relatório</Link>
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
  )
}
