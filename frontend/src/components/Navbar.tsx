import { Link, NavLink, useLocation } from 'react-router-dom'

// Classes de um separador do seletor: o ativo fica branco e a negrito
function tabClass(active: boolean) {
  return active
    ? 'bg-white px-3 py-1.5 text-[0.8rem] font-semibold text-ink'
    : 'px-3 py-1.5 text-[0.8rem] text-muted'
}

export default function Navbar() {
  // É uma página do anfitrião se o URL começar por /host
  const isHost = useLocation().pathname.startsWith('/host')

  return (
    // grid com 3 colunas no computador: logótipo | seletor ao centro | espaço vazio
    <header className="grid grid-cols-[1fr_auto] items-center border-b border-line bg-white px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:px-6">
      <Link to={isHost ? '/host' : '/'} className="flex items-center gap-2.5 font-medium">
        {/* Ícone de "pulso" (linha de batimento cardíaco) desenhado em SVG */}
        <span className="grid h-[26px] w-[26px] place-items-center bg-ink text-white" aria-hidden>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12h5l2-5 4 10 2-5h7" />
          </svg>
        </span>
        Live Pulse
        {isHost && (
          <span className="hidden border-l border-line pl-3 text-sm font-normal text-muted md:inline">
            Controlo do Evento
          </span>
        )}
      </Link>

      {/* Seletor central Público / Anfitrião */}
      <nav className="flex border border-line bg-soft p-0.5">
        <NavLink to="/" className={tabClass(!isHost)}>Público</NavLink>
        <NavLink to="/host" className={tabClass(isHost)}>Anfitrião</NavLink>
      </nav>

      {/* Coluna vazia que mantém o seletor centrado (só no computador) */}
      <div className="hidden md:block" />
    </header>
  )
}
