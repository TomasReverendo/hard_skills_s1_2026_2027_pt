// pages/HostPollPage.tsx — Uma votação vista pelo anfitrião: estado e resultados (a qualquer momento).
// Nível 3: enquanto a votação está aberta, os resultados atualizam-se sozinhos a cada 2 s.
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LiveResults from '../components/LiveResults'
import Message from '../components/Message'
import { usePolling } from '../hooks/usePolling'
import { getHostPoll, getHostResults, updatePollStatus } from '../services/api'
import type { Poll, PollResults, PollStatus } from '../types'

const STEPS: { status: PollStatus; label: string }[] = [
  { status: 'draft', label: 'Rascunho' },
  { status: 'open', label: 'Aberta' },
  { status: 'closed', label: 'Fechada' },
]

const TITLES: Record<PollStatus, string> = {
  draft: 'Votação em rascunho',
  open: 'Votação em direto',
  closed: 'Relatório da votação',
}

export default function HostPollPage() {
  const pollId = Number(useParams().pollId)

  const [poll, setPoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<PollResults | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [now, setNow] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      // Os dois pedidos são independentes, por isso fazem-se em paralelo
      const [pollData, resultsData] = await Promise.all([
        getHostPoll(pollId),
        getHostResults(pollId),
      ])
      setPoll(pollData)
      setResults(resultsData)
      setLastSync(new Date())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [pollId])

  useEffect(() => {
    load()
  }, [load])

  const isOpen = poll?.status === 'open'
  usePolling(load, 2000, isOpen) // só atualiza sozinho enquanto está aberta
  usePolling(() => setNow(Date.now()), 1000) // faz o "há Xs" ir contando

  async function changeStatus(status: PollStatus) {
    try {
      await updatePollStatus(pollId, status)
      await load()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const secondsAgo = lastSync ? Math.max(0, Math.round((now - lastSync.getTime()) / 1000)) : null

  return (
    <main className="page host-page">
      <Link to="/host" className="back">← Voltar ao painel</Link>
      <Message text={error} />

      {poll && results && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-header-top">
              <div>
                <p className="eyebrow">{TITLES[poll.status]}</p>
                <h1 className="question">{poll.question}</h1>
              </div>
              <div className="sync">
                {secondsAgo !== null && (
                  <span className="mono muted small">Última sincronização: há {secondsAgo}s</span>
                )}
                <button className="btn" onClick={load}>↻ Atualizar dados</button>
              </div>
            </div>

            <div className="panel-header-top">
              {/* Indicador de estado: o estado atual fica a preto */}
              <div className="steps" aria-label="Estado da votação">
                {STEPS.map((step) => (
                  <span key={step.status} className={step.status === poll.status ? 'step active' : 'step'}>
                    {step.label}
                  </span>
                ))}
              </div>

              {poll.status === 'draft' && (
                <button className="btn btn-primary" onClick={() => changeStatus('open')}>
                  Abrir para votação
                </button>
              )}
              {poll.status === 'open' && (
                <button className="btn btn-danger-outline" onClick={() => changeStatus('closed')}>
                  <span className="square red" aria-hidden /> Encerrar votação agora
                </button>
              )}
            </div>
          </div>

          <LiveResults results={results} live={isOpen} />
        </div>
      )}
    </main>
  )
}
