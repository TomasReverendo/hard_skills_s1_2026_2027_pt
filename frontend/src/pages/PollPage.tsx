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
import { backLink, button, buttonPrimary, fullWidth, pageNarrow, question, square } from '../ui'
import { twoDigits } from '../utils'

// Classes de uma opção de voto: a escolhida tem borda preta grossa e fundo cinzento.
// (o padding da escolhida é 1px menor para compensar a borda de 2px e nada "saltar")
function optionClass(selected: boolean) {
  const base = 'flex cursor-pointer items-center gap-3 rounded-[3px] text-[0.9rem]'
  return selected
    ? `${base} border-2 border-ink bg-soft px-[calc(1rem-1px)] py-[calc(0.875rem-1px)]`
    : `${base} border border-line px-4 py-3.5`
}

export default function PollPage() {
  // o :pollId vem do URL /polls/:pollId e é um UUID (texto), ex.: 3f2a9c1e-8b7d-...
  const pollId = useParams().pollId ?? ''
  const voterToken = getVoterToken()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [results, setResults] = useState<PollResults | null>(null)
  const [selected, setSelected] = useState<number | null>(null) // id da opção escolhida
  const [votedFor, setVotedFor] = useState<string | null>(null) // texto da opção votada
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [checking, setChecking] = useState(false) // true enquanto o botão "Verificar" espera pela resposta
  const [lastCheck, setLastCheck] = useState<Date | null>(null) // hora da última verificação manual

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

  // Nível 3 (extra): enquanto a votação está aberta, verifico a cada 3 s
  // se o anfitrião já a fechou; quando fecha, os resultados aparecem sozinhos.
  usePolling(loadPoll, 3000, poll?.status === 'open')

  // Botão "Verificar se já fechou". Se a votação continuar aberta, o ecrã ficava igual e
  // parecia que o clique não fazia nada, por isso mostro a hora a que verifiquei.
  async function checkNow() {
    setChecking(true)
    await loadPoll() // se já tiver fechado, a página passa sozinha para os resultados
    setLastCheck(new Date())
    setChecking(false)
  }

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
      <main className={pageNarrow}>
        <Link to="/" className={backLink}>← Voltar à lista</Link>
        {error ? <Message text={error} /> : <p className="text-muted">A carregar…</p>}
      </main>
    )
  }

  // Votação fechada: resultados finais
  if (poll.status === 'closed') {
    return (
      <main className={pageNarrow}>
        <Link to="/" className={backLink}>← Voltar à lista</Link>
        <StatusBadge status={poll.status} />
        <h1 className={question}>{poll.question}</h1>
        {results ? <ResultsList results={results} /> : <p className="text-muted">A carregar…</p>}
      </main>
    )
  }

  // Votação aberta e já votou: confirmação
  if (poll.has_voted) {
    return (
      <main className={pageNarrow}>
        <Link to="/" className={backLink}>← Voltar à lista</Link>
        <div className="mb-5 grid h-10 w-10 place-items-center border-2 border-ink text-xl" aria-hidden>✓</div>
        <h1 className={question}>Voto submetido</h1>
        <p className="text-muted">
          {votedFor ? (
            <>Obrigado! O teu voto na opção <strong className="text-ink">“{votedFor}”</strong> foi guardado.</>
          ) : (
            'Obrigado! O teu voto já foi registado nesta votação.'
          )}
        </p>
        <p className="mb-4 mt-7 border-l-2 border-ink bg-soft px-4 py-3.5 text-sm">
          Os resultados finais serão mostrados aqui assim que o anfitrião fechar a votação.
        </p>
        <button className={`${buttonPrimary} ${fullWidth}`} onClick={checkNow} disabled={checking}>
          {checking ? 'A verificar…' : 'Verificar se já fechou'}
        </button>
        {lastCheck && !checking && (
          <p className="-mt-2 mb-2.5 text-center text-xs text-muted">
            Ainda está aberta (verificado às {lastCheck.toLocaleTimeString('pt-PT')}).
            A página também verifica sozinha a cada 3 s.
          </p>
        )}
        <Link to="/" className={`${button} ${fullWidth}`}>Voltar à lista</Link>
      </main>
    )
  }

  // Votação aberta e ainda não votou: formulário
  return (
    <main className="mx-auto w-full max-w-[840px] px-4 py-6 md:px-6 md:py-10">
      <Link to="/" className={backLink}>← Voltar às votações</Link>

      {/* Telemóvel: empilhado. Computador: pergunta à esquerda, opções à direita */}
      <div className="grid gap-6 md:grid-cols-[1fr_1.5fr] md:gap-16">
        <div>
          <p className="flex items-center gap-2 font-mono text-[0.72rem] font-bold uppercase text-ok">
            <span className={square} aria-hidden /> Em direto
          </p>
          <h1 className="my-3 text-2xl font-medium leading-tight md:text-[2rem]">{poll.question}</h1>
          <p className="text-muted">Seleciona uma opção e submete. Apenas um voto por participante.</p>
        </div>

        <form onSubmit={handleVote}>
          <div className="flex flex-col gap-2.5">
            {poll.options.map((option, index) => (
              <label key={option.id} className={optionClass(selected === option.id)}>
                <span className="font-mono text-xs text-muted">{twoDigits(index)}</span>
                <span className="flex-1">{option.text}</span>
                <input
                  type="radio"
                  name="option"
                  className="h-4 w-4 accent-ink"
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                />
              </label>
            ))}
          </div>
          <Message text={error} />
          {/* O botão só fica ativo depois de escolher uma opção */}
          <button className={`${buttonPrimary} ${fullWidth}`} disabled={sending || selected === null}>
            {sending ? 'A enviar…' : 'Confirmar voto'}
          </button>
        </form>
      </div>
    </main>
  )
}
