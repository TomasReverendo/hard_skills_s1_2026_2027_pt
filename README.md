# Live Pulse: votação em tempo real

Aplicação web full-stack para votações em direto num evento. Tem duas interfaces:

- **Público** (`/`): vê as votações Abertas e Fechadas, vota e vê os resultados finais.
- **Anfitrião** (`/host`): cria votações, muda o estado (Rascunho → Aberta → Fechada) e vê os resultados a qualquer momento.

---

## Stack e porquê

| Camada | Escolha | Porquê |
|---|---|---|
| Backend | **Python 3 + Django 5.2** | ORM com migrações, testes integrados e estrutura clara. É a stack recomendada no enunciado. |
| API | **Views Django simples + `JsonResponse`** | A API é pequena (8 endpoints). O Django REST Framework acrescentaria serializers, viewsets e routers sem trazer nada essencial. Assim, cada pedido HTTP é fácil de seguir do princípio ao fim. |
| Base de dados | **PostgreSQL 16** (via Docker) | Base de dados "a sério", com transações e bloqueios de linha (`SELECT ... FOR UPDATE`), que uso para impedir votos duplicados em pedidos simultâneos. |
| Frontend | **React 18 + TypeScript + Vite** | Os tipos TS espelham o JSON da API e apanham erros ao compilar. O Vite arranca rápido e tem um proxy que evita configurar CORS. |
| Rotas no frontend | **React Router** | Uma página por URL (`/polls/3`), por isso os links podem ser partilhados. |
| Estado | **`useState` + `fetch`** | Chega para uma app deste tamanho. Não uso Redux nem TanStack Query. |
| Estilos | **CSS simples** (um ficheiro, `index.css`) | Sem dependências nem configuração. O visual segue o protótipo Figma: preto e branco, Space Grotesk + Space Mono (Google Fonts). |

---

## Como executar

### Pré-requisitos

- Python 3.10+
- Node.js 18+ e npm
- Docker Desktop (ou um PostgreSQL instalado localmente)

### 1. Base de dados

Na raiz do projeto:

```bash
docker compose up -d
```

O PostgreSQL deste projeto fica na porta **5433** do teu PC, e não na 5432 habitual. Assim não colide com outro PostgreSQL que já esteja a correr (por exemplo, o de outro projeto).

### 2. Backend (Django, porta 8080)

```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env        # macOS/Linux: cp .env.example .env
python manage.py migrate      # cria as tabelas
python manage.py runserver 8080   # http://127.0.0.1:8080
```

> Usamos a porta **8080** porque no Windows a 8000 é muitas vezes reservada pelo Hyper-V/WSL (erro *"You don't have permission to access that port"*). Se a 8080 também estiver reservada, `netsh interface ipv4 show excludedportrange protocol=tcp` mostra as portas bloqueadas. Escolhe outra e muda-a também em `frontend/vite.config.ts`.

Testes automáticos:

```bash
python manage.py test
```

### 3. Frontend (React, porta 5173)

Noutro terminal:

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Abre **http://localhost:5173** para o público e **http://localhost:5173/host** para o anfitrião.

---

## Estrutura do projeto

```
live-pulse/
├── docker-compose.yml        PostgreSQL
├── backend/
│   ├── manage.py
│   ├── config/               configuração Django (settings, urls)
│   └── polls/                a app de votações
│       ├── models.py         tabelas: Poll, Option, Vote
│       ├── services.py       regras de negócio (validar, votar, contar)
│       ├── serializers.py    modelo -> dicionário JSON
│       ├── views.py          camada HTTP (lê o pedido, devolve JSON)
│       ├── urls.py           mapa de rotas da API
│       └── tests.py          testes automáticos
└── frontend/src/
    ├── App.tsx               rotas (páginas)
    ├── types.ts              tipos TS do JSON da API
    ├── services/api.ts       todas as chamadas HTTP
    ├── services/voterToken.ts identificador anónimo do navegador
    ├── hooks/usePolling.ts   atualização automática (Nível 3)
    ├── pages/
    │   ├── PollListPage.tsx  público: lista com filtro Abertas/Fechadas
    │   ├── PollPage.tsx      público: votar / voto submetido / resultados
    │   ├── HostDashboard.tsx anfitrião: estatísticas + tabela + criar
    │   └── HostPollPage.tsx  anfitrião: resultados em direto + mudar estado
    └── components/           peças reutilizáveis (cartão, resultados, modal…)
```

**Backend em 3 camadas:** `views.py` (HTTP) → `services.py` (regras) → `models.py` (dados). As views não têm lógica de negócio. As regras vivem em `services.py` e podem ser testadas e reutilizadas sem HTTP.

---

## Modelo de dados

```
Poll (votação)                 Option (opção)              Vote (voto)
─────────────────              ───────────────             ─────────────────
id                             id                          id
question                       poll_id  → Poll             option_id → Option
status (draft/open/closed)     text                        voter_token
created_at                                                 created_at
```

- `Poll 1 ── N Option 1 ── N Vote`.
- O `Vote` **não** guarda `poll_id`, porque já se chega à votação por `vote.option.poll`. Guardá-lo duplicaria informação (o esquema deixava de estar normalizado).
- **"Um voto por pessoa"** fica no próprio `Vote`, no campo `voter_token` (com índice). Para saber se alguém já votou numa votação, pesquisa-se `Vote` por `option__poll` + `voter_token`.

---

## API REST

Todas as respostas são JSON. Os erros vêm sempre no formato `{"error": "mensagem"}`.

| Método | URL | Descrição | Códigos |
|---|---|---|---|
| GET | `/api/polls` | Votações Abertas + Fechadas | 200 |
| GET | `/api/polls/<id>?voter_token=…` | Detalhe (com `has_voted`) | 200, 404 (inclui Rascunhos) |
| POST | `/api/polls/<id>/votes` | Votar `{option_id, voter_token}` | 201, 400, 404, 409 |
| GET | `/api/polls/<id>/results` | Resultados (só se Fechada) | 200, 403, 404 |
| GET | `/api/host/polls` | Todas as votações | 200 |
| POST | `/api/host/polls` | Criar `{question, options: [...]}` | 201, 400 |
| GET | `/api/host/polls/<id>` | Detalhe de qualquer votação | 200, 404 |
| PATCH | `/api/host/polls/<id>` | Mudar estado `{status}` | 200, 400, 409 |
| GET | `/api/host/polls/<id>/results` | Resultados (sempre) | 200, 404 |

Porque estes códigos:

- **404** num Rascunho pedido pelo público: para o público, um rascunho "não existe".
- **403** nos resultados de uma votação Aberta: o recurso existe, mas o público ainda não o pode ver.
- **409 Conflict** em "já votaste", "votação fechada" ou numa transição de estado inválida: o pedido está bem formado, mas choca com o estado atual.

---

## Níveis completados

### ✅ Nível 1 (essencial)

Completo. O público vê as votações, vota, recebe confirmação e vê os resultados quando a votação fecha. O anfitrião cria votações (2 a 5 opções), muda o estado e vê os resultados.

### ✅ Nível 2 (votação justa)

Fiz as quatro regras:

- **Um voto por pessoa.** Na primeira visita, o navegador gera um UUID e guarda-o em `localStorage`. Esse token é enviado com cada voto, e o backend recusa um segundo voto do mesmo token na mesma votação. Para evitar a "corrida" de dois pedidos ao mesmo tempo, a votação é bloqueada com `select_for_update()` dentro de uma transação.
  - **Como se contorna:** com uma janela anónima, outro navegador ou outro dispositivo, limpando o `localStorage`, ou enviando pedidos diretamente à API com tokens inventados. Para ser robusto seria preciso identificar pessoas a sério (login, código único por participante enviado por email, etc.). Usar o IP não resolve, porque numa sala com o mesmo Wi-Fi toda a gente partilha o IP.
- **Votações fechadas rejeitam votos no backend**, não só no frontend: Rascunho → 404, Fechada → 409.
- **Validação com mensagens claras**, feita no frontend (feedback imediato) e outra vez no backend (a que conta): pergunta vazia, menos de 2 ou mais de 5 opções, opções repetidas, opção que não pertence à votação, JSON inválido.
- **Percentagens e gráfico de barras**: as barras são `<div>` com a largura igual à percentagem, sem bibliotecas de gráficos.

### ✅ Nível 3 (resultados em direto), com polling

- A página de resultados do anfitrião atualiza-se **a cada 2 s** enquanto a votação está aberta e mostra "Última sincronização: há Xs". A tabela do painel geral (totais de votos) atualiza-se a cada 5 s.
- **Extra:** a página do público verifica a cada 3 s se a votação fechou e, quando fecha, mostra os resultados automaticamente. A lista de votações atualiza-se a cada 5 s.

**Porquê polling e não WebSockets/SSE:**

| | Polling | SSE | WebSockets |
|---|---|---|---|
| Direção | cliente pergunta | servidor → cliente | dois sentidos |
| Backend extra | nenhum (usa os mesmos endpoints REST) | ligação longa por cliente; precisa de servidor ASGI | Django Channels + Redis |
| Complexidade | muito baixa | média | alta |
| Escalabilidade | pedidos repetidos, mesmo sem mudanças | boa | boa |

Os dados só vão num sentido (servidor → ecrã) e o "tempo real" de uma votação numa sala não precisa de ser ao milissegundo, por isso o polling é suficiente e não exige infraestrutura nova. Com centenas de participantes eu passaria para **SSE**: encaixa no fluxo unidirecional e é mais simples do que WebSockets.

### Extras

- ✅ **Versão responsiva** (mobile), sobretudo na interface do público.
- ✅ **Testes automáticos** no backend (`python manage.py test`, 12 testes).
- ✅ **docker-compose** para a base de dados.

---

## Decisões e desvios do protótipo Figma

Segui o protótipo Figma em todos os ecrãs: lista do público com filtro lateral, página de voto em duas colunas, "Voto submetido", resultados com a vencedora destacada, painel do anfitrião com estatísticas e tabela, modal "Configurar votação" e a página de resultados em direto. Diferenças em relação ao protótipo:

- **Sem "Editar" nos rascunhos.** Não é pedido no enunciado e acrescentava um endpoint e um formulário. Fica na lista de melhorias.
- **Sem "Simular votação encerrada"** na página de voto. No protótipo serve para demonstrar o ecrã, mas na app real quem fecha a votação é o anfitrião.
- **Estado do anfitrião (Rascunho / Aberta / Fechada)** é um indicador e não um botão: as transições fazem-se com "Abrir para votação" e "Encerrar votação agora", e só avançam.
- O botão "Atualizar" do público fica no cabeçalho da página, não na navbar.
- Pus o anfitrião numa página separada (`/host`) sem autenticação, como o enunciado permite.
- Uma votação nasce sempre em **Rascunho**, e as transições só avançam (Rascunho → Aberta → Fechada). Não se pode reabrir uma votação fechada, porque os resultados são "finais".
- Não uso o middleware de CSRF do Django: a API não usa cookies nem sessões, por isso não há credenciais que o navegador envie automaticamente.

---

## O que melhoraria com mais tempo

- **SSE** em vez de polling, para escalar a muitos participantes.
- **Autenticação do anfitrião.** Hoje qualquer pessoa que saiba o URL `/host` pode gerir as votações.
- **Código QR** em cada votação, para o público entrar rapidamente.
- **Temporizador** que fecha a votação automaticamente.
- **Editar** uma votação enquanto está em Rascunho (existe no Figma).
- **Testes de frontend** (Vitest + Testing Library).
- Pôr backend e frontend também no `docker-compose`, para arrancar tudo com um comando.
