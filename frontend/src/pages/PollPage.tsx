// pages/PollPage.tsx — Página de UMA votação, para o público.
//
// O que se mostra depende do estado:
//   Aberta  + ainda não votou -> pergunta à esquerda, opções à direita, "Confirmar voto"
//   Aberta  + já votou        -> "Voto submetido" (os resultados ficam escondidos)
//   Fechada                   -> resultados finais
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import Message from '../components/Message'
import ResultsList from '../components/ResultsList'
import StatusBadge from '../components/StatusBadge'
import { usePolling } from '../hooks/usePolling'
import { getPublicPoll, getPublicResults, submitVote } from '../services/api'
import { getVoterToken } from '../services/voterToken'
import type { Poll, PollResults } from '../types'
import { twoDigits } from '../utils'

export default function PollPage() {
  const pollId = Number(useParams().pollId) // o :pollId vem do URL /polls/:pollId
  const voterToken = getVoterToken()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<PollResults | null>(null)
  const [selected, setSelected] = useState<number | null>(null) // id da opção escolhida
  const [votedFor, setVotedFor] = useState<string | null>(null) // texto da opção votada
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Lê a votação; se estiver Fechada, lê também os resultados
  const loadPoll = useCallback(async () => {
    try {
      const data = await getPublicPoll(pollId, voterToken)
      setPoll(data)
      if (data.status === 'closed') setResults(await getPublicResults(pollId))
    } catch (err) {
      setError((err as Error).message)
    }
  }, [pollId, voterToken])

  useEffect(() => {
    loadPoll()
  }, [loadPoll])

  // Nível 3 (extra): enquanto a votação está aberta, verificamos a cada 3 s
  // se o anfitrião já a fechou; quando fecha, os resultados aparecem sozinhos.
  usePolling(loadPoll, 3000, poll?.status === 'open')

  async function handleVote(event: FormEvent) {
    event.preventDefault()
    if (selected === null || !poll) return

    setSending(true)
    setError(null)
    try {
      await submitVote(pollId, selected, voterToken)
      setVotedFor(poll.options.find((o) => o.id === selected)?.text ?? null)
      await loadPoll() // atualiza has_voted -> passa para o ecrã "Voto submetido"
    } catch (err) {
      setError((err as Error).message) // ex.: "Já votaste nesta votação."
    } finally {
      setSending(false)
    }
  }

  // Ainda a carregar, ou erro ao carregar (ex.: votação não existe)
  if (!poll) {
    return (
      <main className="page narrow">
        <Link to="/" className="back">← Voltar à lista</Link>
        {error ? <Message text={error} /> : <p className="muted">A carregar…</p>}
      </main>
    )
  }

  // ---- Votação FECHADA: resultados finais ----
  if (poll.status === 'closed') {
    return (
      <main className="page narrow">
        <Link to="/" className="back">← Voltar à lista</Link>
        <StatusBadge status={poll.status} />
        <h1 className="question">{poll.question}</h1>
        {results ? <ResultsList results={results} /> : <p className="muted">A carregar…</p>}
      </main>
    )
  }

  // ---- Votação ABERTA e já votou: confirmação ----
  if (poll.has_voted) {
    return (
      <main className="page narrow">
        <Link to="/" className="back">← Voltar à lista</Link>
        <div className="check-box" aria-hidden>✓</div>
        <h1 className="question">Voto submetido</h1>
        <p className="muted">
          {votedFor ? (
            <>Obrigado! O teu voto na opção <strong>“{votedFor}”</strong> foi guardado.</>
          ) : (
            'Obrigado! O teu voto já foi registado nesta votação.'
          )}
        </p>
        <p className="note">Os resultados finais serão mostrados aqui assim que o anfitrião fechar a votação.</p>
        <button className="btn btn-primary btn-block" onClick={loadPoll}>Verificar se já fechou</button>
        <Link to="/" className="btn btn-block">Voltar à lista</Link>
      </main>
    )
  }

  // ---- Votação ABERTA e ainda não votou: formulário ----
  return (
    <main className="page vote-page">
      <Link to="/" className="back">← Voltar às votações</Link>

      <div className="vote-layout">
        <div>
          <p className="live-label"><span className="square" aria-hidden /> Em direto</p>
          <h1 className="vote-question">{poll.question}</h1>
          <p className="muted">Seleciona uma opção e submete. Apenas um voto por participante.</p>
        </div>

        <form onSubmit={handleVote}>
          <div className="options">
            {poll.options.map((option, index) => (
              <label
                key={option.id}
                className={selected === option.id ? 'option selected' : 'option'}
              >
                <span className="mono muted small">{twoDigits(index)}</span>
                <span className="option-text">{option.text}</span>
                <input
                  type="radio"
                  name="option"
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                />
              </label>
            ))}
          </div>
          <Message text={error} />
          {/* O botão só fica ativo depois de escolher uma opção */}
          <button className="btn btn-primary btn-block" disabled={sending || selected === null}>
            {sending ? 'A enviar…' : 'Confirmar voto'}
          </button>
        </form>
      </div>
    </main>
  )
}
