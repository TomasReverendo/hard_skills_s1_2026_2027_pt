// components/CreatePollModal.tsx — Janela (modal) "Configurar votação", aberta pelo botão "+ Criar votação".
//
// Validamos aqui para dar feedback imediato, MAS o backend volta a validar tudo
// (nunca se confia só no frontend). Se o backend recusar, mostramos o erro dele.
import { useState, type FormEvent } from 'react'
import { createPoll } from '../services/api'
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
    // Fundo escuro: clicar fora da janela fecha-a
    <div className="modal-backdrop" onClick={onClose}>
      {/* stopPropagation: clicar DENTRO da janela não deve fechá-la */}
      <form
        className="modal"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title">Configurar votação</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className="modal-body">
          <label htmlFor="question">Pergunta da votação *</label>
          <input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Escreve uma pergunta clara e direta"
            maxLength={200}
            autoFocus
          />

          <div className="label-row">
            <label>Opções de resposta</label>
            <span className="mono muted small">{options.length}/{MAX_OPTIONS}</span>
          </div>

          {options.map((option, index) => (
            <div className="option-input" key={index}>
              <span className="mono muted small">{twoDigits(index)}.</span>
              <input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Opção ${index + 1}`}
                maxLength={100}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => removeOption(index)}
                disabled={options.length <= MIN_OPTIONS}
                aria-label={`Remover opção ${index + 1}`}
              >
                ✕
              </button>
            </div>
          ))}

          {options.length < MAX_OPTIONS && (
            <button type="button" className="btn btn-dashed" onClick={addOption}>
              + Adicionar opção
            </button>
          )}

          <Message text={error} />
        </div>

        <div className="modal-footer">
          <span className="muted small">Será guardada inicialmente como Rascunho.</span>
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'A guardar…' : 'Guardar votação'}
          </button>
        </div>
      </form>
    </div>
  )
}
