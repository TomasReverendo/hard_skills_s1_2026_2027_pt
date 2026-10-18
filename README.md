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
| Base de dados | **PostgreSQL 16** | Base de dados "a sério", com transações e bloqueios de linha (`SELECT ... FOR UPDATE`), que uso para impedir votos duplicados em pedidos simultâneos. |
| Frontend | **React 18 + TypeScript + Vite** | Os tipos TS espelham o JSON da API e apanham erros ao compilar. O Vite arranca rápido e tem um proxy que evita configurar CORS. |
| Rotas no frontend | **React Router** | Uma página por URL (`/polls/<uuid>`), por isso os links podem ser partilhados. |
| Estado | **`useState` + `fetch`** |  |
| Execução | **Docker + docker-compose + Makefile** | Um só comando (`make up`) arranca a BD, o backend e o frontend, sem instalar Python, Node nem PostgreSQL no PC. O `Makefile` dá nomes curtos aos comandos do Docker. |
| Estilos | **Tailwind CSS 4** | Os estilos ficam junto do JSX de cada componente (`className="flex gap-4 border"`), por isso não há um ficheiro CSS gigante para manter. As cores e os tipos de letra do Figma estão definidos uma vez no tema (`index.css`), e as combinações repetidas (botões, campos) estão em `ui.ts`. O Tailwind só gera o CSS das classes que são usadas. |

### Porquê Docker

O projeto tem três peças que precisam de versões certas para funcionar: Python 3.12 com Django, Node 22 com Vite, e PostgreSQL 16. Sem Docker, quem quiser correr o projeto tem de instalar tudo à mão, criar a base de dados, configurar a password e acertar as portas, e qualquer diferença na máquina pode dar erros. Senti isso durante o desenvolvimento: tinha um PostgreSQL antigo de outro projeto a ocupar a porta 5432 e o Windows bloqueava a porta 8000. Com o Docker, cada serviço corre num contentor isolado com as versões fixadas nos `Dockerfile`s, e o `docker-compose.yml` liga os três numa rede própria (o backend chega à BD pelo nome `db` e o frontend chega ao backend pelo nome `backend`). Assim, quem avalia o projeto só precisa do Docker Desktop e de um comando (`make up`) para ter tudo a correr exatamente como no meu computador. A opção sem Docker continua documentada abaixo para quem preferir.

---

## Como executar

Há duas formas. A **opção A (Docker)** é a mais simples: arranca a base de dados, o backend e o frontend com um só comando.

### Opção A: Docker (recomendado)

**Pré-requisitos:** [Docker Desktop](https://www.docker.com/) e, opcionalmente, `make`.

Na raiz do projeto:

```bash
make up          # ou, sem make:  docker compose up --build -d
```

Depois abre **http://localhost:5173** (público) e **http://localhost:5173/host** (anfitrião).

| Serviço | O que é | Porta local |
|---|---|---|
| `db` | PostgreSQL 16 | 5433 |
| `backend` | Django (API) | 8080 → http://localhost:8080/api/polls |
| `frontend` | React + Vite | 5173 → http://localhost:5173 |

O backend só arranca quando a base de dados está pronta (`healthcheck`) e aplica as migrações sozinho ao arrancar.

**Comandos do `Makefile`** (`make help` mostra todos):

| Comando | Equivalente | Para quê |
|---|---|---|
| `make up` | `docker compose up --build -d` | Construir e arrancar tudo |
| `make down` | `docker compose down` | Parar tudo (os dados ficam guardados) |
| `make logs` | `docker compose logs -f` | Ver os logs em direto |
| `make ps` | `docker compose ps` | Estado dos contentores |
| `make test` | `docker compose exec backend python manage.py test` | Correr os testes do backend |
| `make migrate` | `docker compose exec backend python manage.py migrate` | Aplicar migrações |
| `make psql` | `docker compose exec db psql -U postgres -d livepulse` | Consola do PostgreSQL |
| `make reset` | `docker compose down -v` + `up` | **Apagar a base de dados** e arrancar do zero |

> **`make` no Windows:** não vem instalado. Podes instalá-lo com `winget install GnuWin32.Make`, mas o instalador **não o põe no PATH**. Acrescenta-o assim no PowerShell e depois fecha e volta a abrir o VS Code ou o terminal:
>
> ```powershell
> [Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Program Files (x86)\GnuWin32\bin", "User")
> ```
>
> Em alternativa, usa o Git Bash ou corre diretamente os comandos `docker compose` da coluna "Equivalente".

> **Se já tinhas a base de dados de uma versão anterior** (com ids numéricos), corre `make reset` uma vez para recriar as tabelas com UUID.

### Opção B: sem Docker (cada parte à mão)

**Pré-requisitos:** Python 3.10+, Node.js 18+ e um PostgreSQL. O mais fácil é arrancar só a BD com Docker: `docker compose up -d db`.

O PostgreSQL deste projeto fica na porta **5433** da máquina, e não na 5432 habitual, para não colidir com outro PostgreSQL que já esteja a correr.

**Backend (Django, porta 8080):**

```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env            # macOS/Linux: cp .env.example .env
python manage.py migrate          # cria as tabelas
python manage.py runserver 8080   # http://127.0.0.1:8080
python manage.py test             # testes automáticos
```

> Uso a porta **8080** porque no Windows a 8000 é muitas vezes reservada pelo Hyper-V/WSL (erro *"You don't have permission to access that port"*). Se a 8080 também estiver reservada, `netsh interface ipv4 show excludedportrange protocol=tcp` mostra as portas bloqueadas.

**Frontend (React, porta 5173)**, noutro terminal:

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

---

## Estrutura do projeto

```
live-pulse/
├── docker-compose.yml        os 3 serviços: db + backend + frontend
├── Makefile                  atalhos para os comandos do Docker (make help)
├── DB-diagram/               diagramas da base de dados
├── backend/
│   ├── Dockerfile            imagem do backend (Python + Django)
│   ├── manage.py
│   ├── config/               configuração Django (settings, urls)
│   └── polls/                a app de votações
│       ├── models.py         tabelas: Poll, Option, Vote
│       ├── services.py       regras de negócio (validar, votar, contar)
│       ├── serializers.py    modelo -> dicionário JSON
│       ├── views.py          camada HTTP (lê o pedido, devolve JSON)
│       ├── urls.py           mapa de rotas da API
│       └── tests.py          testes automáticos
└── frontend/
    ├── Dockerfile            imagem do frontend (Node + Vite)
    ├── vite.config.ts        servidor de desenvolvimento + proxy /api
    └── src/
        ├── App.tsx               rotas (páginas)
        ├── index.css             Tailwind + tema (cores e fontes do Figma)
        ├── ui.ts                 grupos de classes Tailwind reutilizados (botões, campos…)
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
id (UUID)                      id                          id
question                       poll_id  → Poll             option_id → Option
status (draft/open/closed)     text                        voter_token
created_at                                                 created_at
```

- `Poll 1 ── N Option 1 ── N Vote`.
- **A votação usa um UUID** como chave primária (ex.: `0e083f4d-7a24-41e1-9461-5b48b3c7f2d3`) em vez de um número sequencial. Como o id aparece nos links (`/polls/<id>`), um número permitia adivinhar e percorrer as outras votações (`/polls/1`, `/polls/2`…), incluindo os rascunhos, e revelava quantas votações existem. Com UUID aleatório (`uuid4`) isso deixa de ser possível. As opções e os votos mantêm ids numéricos: não aparecem em links, e o id das opções serve para manter a ordem em que foram criadas.
- O `Vote` **não** guarda `poll_id`, porque já se chega à votação por `vote.option.poll`. Guardá-lo duplicaria informação (o esquema deixava de estar normalizado).
- **"Um voto por pessoa"** fica no próprio `Vote`, no campo `voter_token` (com índice). Para saber se alguém já votou numa votação, pesquisa-se `Vote` por `option__poll` + `voter_token`.

---

## API REST

Todas as respostas são JSON. Os erros vêm sempre no formato `{"error": "mensagem"}`.

| Método | URL | Descrição | Códigos |
|---|---|---|---|
| GET | `/api/polls` | Votações Abertas + Fechadas | 200 |
| GET | `/api/polls/<uuid>?voter_token=…` | Detalhe (com `has_voted`) | 200, 404 (inclui Rascunhos) |
| POST | `/api/polls/<uuid>/votes` | Votar `{option_id, voter_token}` | 201, 400, 404, 409 |
| GET | `/api/polls/<uuid>/results` | Resultados (só se Fechada) | 200, 403, 404 |
| GET | `/api/host/polls` | Todas as votações | 200 |
| POST | `/api/host/polls` | Criar `{question, options: [...]}` | 201, 400 |
| GET | `/api/host/polls/<uuid>` | Detalhe de qualquer votação | 200, 404 |
| PATCH | `/api/host/polls/<uuid>` | Mudar estado `{status}` | 200, 400, 409 |
| GET | `/api/host/polls/<uuid>/results` | Resultados (sempre) | 200, 404 |

O `<uuid>` é o id da votação. No `urls.py` uso o conversor `<uuid:poll_id>` do Django, por isso um id que não seja um UUID válido (ex.: `/api/polls/1`) dá logo 404.

### Códigos HTTP usados

Cada resposta traz um código que diz ao cliente como correu o pedido. Os `2xx` são sucesso, os `4xx` são erros do cliente (o pedido tem algum problema) e os `5xx` são erros do servidor.

| Código | Nome | Quando é devolvido nesta API |
|---|---|---|
| **200** | OK | O pedido correu bem (ler votações, mudar estado, ver resultados) |
| **201** | Created | Foi criado algo novo: uma votação ou um voto |
| **400** | Bad Request | Os dados enviados são inválidos: pergunta vazia, menos de 2 ou mais de 5 opções, opções repetidas, opção de outra votação, JSON mal formado |
| **403** | Forbidden | O recurso existe mas ainda não pode ser visto: resultados de uma votação Aberta pedidos pelo público |
| **404** | Not Found | O recurso não existe: votação inexistente, id que não é UUID, ou um Rascunho pedido pelo público (para o público, um rascunho "não existe") |
| **409** | Conflict | O pedido está bem formado mas choca com o estado atual: "já votaste", votar numa votação Fechada, ou uma transição de estado inválida (ex.: Rascunho → Fechada) |
| **500** | Internal Server Error | Erro inesperado no servidor. A API nunca o devolve de propósito: os dados inválidos são apanhados antes e dão 400 (há um teste que garante que JSON inválido não dá 500) |

---

## Testes

Os testes estão em `backend/polls/tests.py` e usam o `TestCase` do Django. O `self.client` faz pedidos HTTP à API sem precisar do servidor ligado, e o pedido passa pelo caminho normal (`urls → views → services → models`). Cada teste corre numa base de dados temporária e vazia, criada e apagada pelo Django, por isso os dados reais nunca são tocados.

```bash
make test                     # com Docker
python manage.py test         # sem Docker, dentro de backend/
```

| Teste | O que garante |
|---|---|
| **Nível 1** | |
| `test_create_poll_starts_as_draft` | Uma votação nova começa em Rascunho e guarda todas as opções |
| `test_poll_id_is_uuid` | O id é um UUID (36 caracteres) e um id numérico (`/1`) devolve 404 |
| `test_public_list_hides_drafts` | O público não vê Rascunhos, nem na lista nem no detalhe (404) |
| `test_host_list_shows_everything` | O anfitrião vê todas as votações, incluindo Rascunhos |
| `test_status_flow_draft_open_closed` | O fluxo Rascunho → Aberta → Fechada funciona |
| `test_cannot_go_backwards_or_skip` | Saltar de Rascunho para Fechada é recusado (409) |
| `test_vote_and_results` | Os votos são contados e as percentagens calculadas (ex.: 2 em 3 = 66.7 %) |
| `test_public_results_only_when_closed` | Os resultados públicos dão 403 com a votação Aberta e 200 depois de Fechada |
| **Nível 2** | |
| `test_one_vote_per_person` | O segundo voto do mesmo token é recusado (409), só fica 1 voto na BD e `has_voted` passa a `true` |
| `test_backend_rejects_votes_on_draft_and_closed` | O backend recusa votos num Rascunho (404) e numa votação Fechada (409) |
| `test_option_from_another_poll_is_rejected` | Não é possível votar com uma opção de outra votação (400) |
| `test_validation_errors` | Pergunta vazia, 1 opção, 6 opções, opções repetidas ou opções que não são lista dão 400 e não gravam nada |
| `test_invalid_json_returns_400` | Um corpo que não é JSON dá 400 e não um erro 500 |

Os testes focam-se nas regras que **o backend tem de garantir sozinho**, porque o frontend pode ser contornado com pedidos diretos à API.

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


### Extras

- ✅ **Versão responsiva** (mobile), sobretudo na interface do público.
- ✅ **Testes automáticos** no backend (`make test`, 13 testes, ver [Testes](#testes)).
- ✅ **Docker / docker-compose**: `Dockerfile` no backend e no frontend, e um `docker-compose.yml` com os 3 serviços. Tudo arranca com `make up`.
- ✅ **Makefile** com atalhos para os comandos do Docker.
- ✅ **UUID nos links** das votações, em vez de ids numéricos.

---

## Decisões e desvios do protótipo Figma

Segui o protótipo Figma em todos os ecrãs: lista do público com filtro lateral, página de voto em duas colunas, "Voto submetido", resultados com a vencedora destacada, painel do anfitrião com estatísticas e tabela, modal "Configurar votação" e a página de resultados em direto. Diferenças em relação ao protótipo:

- **Sem "Editar" nos rascunhos.** Não é pedido no enunciado e acrescentava um endpoint e um formulário. Fica na lista de melhorias.
- **Sem "Simular votação encerrada"** na página de voto. No protótipo serve para demonstrar o ecrã, mas na app real quem fecha a votação é o anfitrião.
- **Estado do anfitrião (Rascunho / Aberta / Fechada)** é um indicador e não um botão: as transições fazem-se com "Abrir para votação" e "Encerrar votação agora", e só avançam.
- O botão "Atualizar" do público fica no cabeçalho da página, não na navbar.
- Pus o anfitrião numa página separada (`/host`) sem autenticação, como o enunciado permite.
- Uma votação nasce sempre em **Rascunho**, e as transições só avançam (Rascunho → Aberta → Fechada). Não se pode reabrir uma votação fechada, porque os resultados são "finais".

---

## O que melhoraria com mais tempo

- **Autenticação do anfitrião.** Hoje qualquer pessoa que saiba o URL `/host` pode gerir as votações.
- **Código QR** em cada votação, para o público entrar rapidamente.
- **Temporizador** que fecha a votação automaticamente.