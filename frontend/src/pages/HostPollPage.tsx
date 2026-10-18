// Página de uma votação para o anfitrião: estado e resultados.
// Nível 3: enquanto a votação está aberta, os resultados atualizam-se sozinhos a cada 2 s.
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import LiveResults from '../components/LiveResults'
import Message from '../components/Message'
import { usePolling } from '../hooks/usePolling'
import { getHostPoll, getHostResults, updatePollStatus } from '../services/api'
import type { Poll, PollResults, PollStatus } from '../types'
import { backLink, button, buttonDangerOutline, buttonPrimary, eyebrow, hostBackground, page, square } from '../ui'

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
  const pollId = useParams().pollId ?? '' // UUID da votação, vindo do URL

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
    <div className={hostBackground}>
      <main className={page}>
        <Link to="/host" className={backLink}>← Voltar ao painel</Link>
        <Message text={error} />

        {poll && results && (
          <div className="border border-line bg-white">
            <div className="flex flex-col gap-4 border-b border-line p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={eyebrow}>{TITLES[poll.status]}</p>
                  <h1 className="text-[1.4rem] font-medium">{poll.question}</h1>
                </div>
                <div className="flex items-center gap-3.5">
                  {secondsAgo !== null && (
                    <span className="font-mono text-xs text-muted">Última sincronização: há {secondsAgo}s</span>
                  )}
                  <button className={button} onClick={load}>↻ Atualizar dados</button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Indicador de estado: o estado atual fica a preto */}
                <div className="flex divide-x divide-line border border-line" aria-label="Estado da votação">
                  {STEPS.map((step) => (
                    <span
                      key={step.status}
                      className={
                        step.status === poll.status
                          ? 'bg-ink px-4 py-2.5 font-mono text-[0.68rem] uppercase text-white'
                          : 'px-4 py-2.5 font-mono text-[0.68rem] uppercase'
                      }
                    >
                      {step.label}
                    </span>
                  ))}
                </div>

                {poll.status === 'draft' && (
                  <button className={buttonPrimary} onClick={() => changeStatus('open')}>
                    Abrir para votação
                  </button>
                )}
                {poll.status === 'open' && (
                  <button className={buttonDangerOutline} onClick={() => changeStatus('closed')}>
                    <span className={square} aria-hidden /> Encerrar votação agora
                  </button>
                )}
              </div>
            </div>

            <LiveResults results={results} live={isOpen} />
          </div>
        )}
      </main>
    </div>
  )
}
