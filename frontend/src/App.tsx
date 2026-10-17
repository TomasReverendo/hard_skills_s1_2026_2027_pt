// App.tsx: Componente raiz: a barra do topo e o mapa de páginas (rotas).
//
//   /                    lista de votações (público)
//   /polls/:pollId       votar / ver resultados (público)
//   /host                painel do anfitrião
//   /host/polls/:pollId  resultados para o anfitrião
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import HostDashboard from './pages/HostDashboard'
import HostPollPage from './pages/HostPollPage'
import PollListPage from './pages/PollListPage'
import PollPage from './pages/PollPage'
import { page, pageTitle } from './ui'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<PollListPage />} /> 
        <Route path="/polls/:pollId" element={<PollPage />} />
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/host/polls/:pollId" element={<HostPollPage />} />
        <Route path="*" element={<main className={page}><h1 className={pageTitle}>Página não encontrada</h1></main>} />
      </Routes>
    </BrowserRouter>
  )
}
