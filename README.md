# Achei Vaga 🅿️

App colaborativo para encontrar e reportar vagas livres de estacionamento na rua, em tempo quase real. Quem sai de uma vaga reporta em 1 toque; quem está chegando vê no mapa as vagas reportadas nos últimos minutos perto dele.

## 1. Arquitetura

```
┌──────────────────┐      HTTPS/JSON       ┌───────────────────┐
│  Frontend (SPA)   │ ───────────────────▶ │   API (Express)    │
│  React + Vite      │ ◀─────────────────── │   Node.js + TS      │
│  Leaflet (mapa)     │      polling 15s      │   JWT auth           │
└──────────────────┘                       └─────────┬─────────┘
                                                       │ SQL (pg)
                                                       ▼
                                            ┌───────────────────┐
                                            │ PostgreSQL + PostGIS│
                                            │ (geoespacial)        │
                                            └───────────────────┘
                                                       ▲
                                                       │ cache / rate-limit (futuro)
                                            ┌───────────────────┐
                                            │       Redis          │
                                            └───────────────────┘
```

**Por que essas escolhas para o MVP:**
- **PostgreSQL + PostGIS**: buscas "vagas num raio de X metros" são o coração do produto. PostGIS faz isso nativamente e com índice espacial (GIST) — muito mais rápido e correto do que calcular distância na aplicação.
- **Node.js + Express + TypeScript**: time pequeno, deploy simples, tipagem evita bugs bobos em algo que mexe com coordenadas e dinheiro de tempo das pessoas (literalmente "achar vaga rápido").
- **Polling de 15s no MVP em vez de WebSocket**: 90% do valor com 10% da complexidade operacional. O código já isola a camada de "spots service", então trocar para WebSocket (Socket.io) depois é uma mudança localizada, não um redesenho — ver seção "Como evoluir".
- **JWT stateless**: sem sessão em servidor, fácil escalar horizontalmente atrás de um load balancer.

## 2. Estrutura de arquivos

```
acheivaga/
├── docker-compose.yml          # sobe Postgres+PostGIS, backend e frontend juntos
├── backend/
│   ├── migrations/001_init.sql # schema do banco
│   └── src/
│       ├── server.ts           # bootstrap (porta, sinal de shutdown)
│       ├── app.ts              # express app + middlewares + rotas
│       ├── config/              # env e conexão com o banco
│       ├── middleware/          # auth (JWT) e tratamento de erro
│       ├── routes/              # definição das rotas HTTP
│       ├── controllers/         # parsing de request/response
│       ├── services/            # regra de negócio (o "miolo")
│       ├── utils/               # jwt, validação
│       └── types/               # tipos compartilhados
└── frontend/
    └── src/
        ├── api/client.ts        # wrapper de fetch com token
        ├── context/AuthContext  # estado global de sessão
        ├── hooks/useNearbySpots # polling de vagas próximas
        ├── pages/                # Login, Registro, Mapa (tela principal)
        └── components/           # MapView, SpotCard, ReportButton, BottomSheet
```

## 3. Esquema do banco de dados

Ver `backend/migrations/001_init.sql`. Resumo:

**users** — id, email, password_hash, name, created_at
**parking_spots** — id, reporter_id, location (`geography(Point,4326)`), lat, lng, status (`available|taken|expired`), confidence_score, reported_at, expires_at, updated_at
**spot_confirmations** — id, spot_id, user_id, type (`confirm|taken`), created_at

Regras de negócio embutidas no schema:
- Uma vaga expira sozinha (`expires_at`) — TTL padrão de 15 min, renovado a cada confirmação.
- `confidence_score` sobe com confirmações e desce com reports de "ocupada"; abaixo de zero a vaga vira `taken` automaticamente.

## 4. Endpoints da API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | não | cria conta |
| POST | `/api/auth/login` | não | retorna JWT |
| GET | `/api/auth/me` | sim | dados do usuário logado |
| GET | `/api/spots/nearby?lat&lng&radius_m` | sim | vagas disponíveis num raio (padrão 500m) |
| POST | `/api/spots` | sim | reporta vaga livre `{lat, lng}` |
| POST | `/api/spots/:id/confirm` | sim | confirma ou marca ocupada `{type}` |
| DELETE | `/api/spots/:id` | sim | cancela o próprio report |
| GET | `/api/health` | não | health check |

`POST /api/auth/register` e `POST /api/auth/login` têm rate limit (20 tentativas / 15 min por IP) contra força bruta e criação em massa de contas.

## 5. Arquitetura da interface

Mobile-first, uma tela principal:

```
┌─────────────────────────┐
│   [Achei Vaga]      👤   │  topo fixo
├─────────────────────────┤
│                          │
│                          │
│       MAPA (Leaflet)      │  ocupa a tela toda
│     ● vagas próximas       │
│     📍 você                │
│                          │
├─────────────────────────┤
│  ▲ Vagas perto (bottom    │  sheet arrastável
│    sheet com lista)         │
│  [ 🅿️ Reportar vaga aqui ]  │  ação primária flutuante
└─────────────────────────┘
```

- **MapPage**: tela única pós-login, mapa + bottom sheet com lista das vagas ordenadas por distância.
- **ReportButton**: botão flutuante — 1 toque usa a geolocalização atual e reporta.
- **SpotCard**: cada vaga na lista/mapa mostra "há quantos minutos" e ações "ainda tá livre" / "já foi".

## 6. Como rodar localmente

```bash
docker compose up --build
# backend em http://localhost:3000
# frontend em http://localhost:5173
```

Ou manualmente: ver `backend/.env.example` e `frontend/.env.example`, instalar dependências com `npm install` em cada pasta e rodar `npm run dev`.

Contra um banco já existente (fora do Docker Compose, ex. RDS/Supabase/Neon), aplique as migrations com `npm run migrate` dentro de `backend/` — o script lê `backend/migrations/*.sql` em ordem e registra o que já foi aplicado em `schema_migrations`, então é seguro rodar de novo a cada deploy.

## 7. Como evoluir (roadmap técnico)

1. **WebSocket real-time**: trocar o polling do `useNearbySpots` por Socket.io — o backend já expõe `spots.service.ts` como fonte única de verdade, então basta emitir evento ao criar/confirmar vaga.
2. **Redis**: cache do resultado de `/spots/nearby` (TTL 5s) para aguentar picos, e rate-limit por usuário/IP.
3. **Fila de expiração**: job (BullMQ) rodando a cada minuto para marcar `expired` as vagas vencidas, em vez de calcular na hora da query.
4. **Reputação de usuário**: pontuação por reports confirmados corretos, para dar mais peso a usuários confiáveis no `confidence_score`.
5. **Push notifications**: avisar usuários que estão procurando vaga numa área quando uma nova aparece perto.
6. **Multi-cidade / particionamento**: se o volume crescer, particionar `parking_spots` por cidade.
