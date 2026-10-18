// Valido aqui para dar feedback imediato, mas o backend volta a validar tudo
// (o frontend pode ser contornado). Se o backend recusar, mostro a mensagem de erro dele.
import { useState, type FormEvent } from 'react'
import { createPoll } from '../services/api'
import { button, buttonDashed, buttonPrimary, iconButton, input, label } from '../ui'
import { twoDigits } from '../utils'
import Message from './Message'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 5

interface Props {
  onClose: () => void // fecha o modal sem guardar
  onCreated: () => void // avisa a página-mãe para recarregar a lista
}

export default function CreatePollModal({ onClose, onCreated }: Props) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState<string[]>(['', '']) // começa com 2 campos vazios
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Atualiza o texto da opção na posição `index` (sem alterar o array original)
  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  function addOption() {
    if (options.length < MAX_OPTIONS) setOptions([...options, ''])
  }

  function removeOption(index: number) {
    if (options.length > MIN_OPTIONS) setOptions(options.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault() // impede o navegador de recarregar a página
    setError(null)

    const filled = options.map((o) => o.trim()).filter(Boolean)
    if (!question.trim()) return setError('A pergunta não pode estar vazia.')
    if (filled.length < MIN_OPTIONS) return setError(`Indica pelo menos ${MIN_OPTIONS} opções.`)

    setSaving(true)
    try {
      await createPoll(question, filled)
      onCreated()
      onClose()
    } catch (err) {
      setError((err as Error).message) // mensagem que veio do backend
    } finally {
      setSaving(false)
    }
  }

  return (
    // Fundo escuro por cima da página (fixed = fica fixo no ecrã). Clicar fora fecha o modal.
    <div className="fixed inset-0 grid place-items-center bg-black/25 p-4" onClick={onClose}>
      {/* stopPropagation: clicar DENTRO da janela não deve fechá-la */}
      <form
        className="w-full max-w-[465px] border border-line bg-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="modal-title" className="text-[1.1rem] font-medium">Configurar votação</h2>
          <button type="button" className={iconButton} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="flex flex-col gap-2.5 p-5">
          <label htmlFor="question" className={label}>Pergunta da votação *</label>
          <input
            id="question"
            className={input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Escreve uma pergunta clara e direta"
            maxLength={200}
            autoFocus
          />

          <div className="mt-3 flex items-center justify-between">
            <span className={label}>Opções de resposta</span>
            <span className="font-mono text-xs text-muted">{options.length}/{MAX_OPTIONS}</span>
          </div>

          {options.map((option, index) => (
            <div className="flex items-center gap-2.5" key={index}>
              <span className="font-mono text-xs text-muted">{twoDigits(index)}.</span>
              <input
                className={input}
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Opção ${index + 1}`}
                maxLength={100}
              />
              <button
                type="button"
                className={iconButton}
                onClick={() => removeOption(index)}
                disabled={options.length <= MIN_OPTIONS}
                aria-label={`Remover opção ${index + 1}`}
              >
                ✕
              </button>
            </div>
          ))}

          {options.length < MAX_OPTIONS && (
            <button type="button" className={buttonDashed} onClick={addOption}>
              + Adicionar opção
            </button>
          )}

          <Message text={error} />
        </div>

        <div className="flex items-center gap-2.5 border-t border-line bg-soft px-5 py-3.5">
          <span className="flex-1 text-xs text-muted">Será guardada inicialmente como Rascunho.</span>
          <button type="button" className={button} onClick={onClose}>Cancelar</button>
          <button type="submit" className={buttonPrimary} disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar votação'}
          </button>
        </div>
      </form>
    </div>
  )
}
