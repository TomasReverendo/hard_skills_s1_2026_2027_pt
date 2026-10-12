// components/Navbar.tsx — Barra do topo: logótipo e seletor Público / Anfitrião.
import { Link, NavLink, useLocation } from 'react-router-dom'

export default function Navbar() {
  // Estamos numa página do anfitrião se o URL começar por /host
  const isHost = useLocation().pathname.startsWith('/host')

  return (
    <header className="navbar">
      <Link to={isHost ? '/host' : '/'} className="brand">
        {/* Ícone de "pulso" (linha de batimento cardíaco) desenhado em SVG */}
        <span className="brand-logo" aria-hidden>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12h5l2-5 4 10 2-5h7" />
          </svg>
        </span>
        Live Pulse
        {isHost && <span className="brand-sub">Controlo do Evento</span>}
      </Link>

      {/* Seletor central. NavLink acrescenta a classe "active" ao link da página atual */}
      <nav className="segmented">
        <NavLink to="/" className={() => (isHost ? '' : 'active')}>Público</NavLink>
        <NavLink to="/host">Anfitrião</NavLink>
      </nav>

      <div className="navbar-spacer" />
    </header>
  )
}
