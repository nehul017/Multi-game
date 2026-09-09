# Game Backend Analysis & Migration Plan

This document records the existing MultiGame architecture and the plan used to add a shared game communication layer **without rewriting the platform**.

---

## 1. Current architecture

```
Frontend (Next.js 14 App Router)
    │
    ├── REST  →  Express /api/*  →  Services  →  Repositories  →  MongoDB
    └── Socket.IO client (4 namespaces)
            │
            ▼
        One HTTP + Socket.IO server
            │
            ├── /          presence-ish main socket
            ├── /game      matchmaking + engines + poker + fruit slots
            ├── /chat
            ├── /notifications
            └── /presence
            │
            ├── Optional Redis (Socket.IO adapter, poker/slots locks)
            └── MongoDB (users, matches, catalog, economy, poker, slots)
```

**Rules already in place that this work preserves:**

- One Node.js backend
- One Socket.IO server
- One Redis client (`config/redis.ts`)
- Game-specific rules live in `backend/src/games/*`
- Shared match flow lives in `backend/src/socket/namespaces/game.ts`

---

## 2. Next.js application structure

```
frontend/src/
  app/                 App Router: auth, dashboard, admin
  components/game/     Shared boards (TTT, C4, Ludo, Quiz, Chess)
  games/               Dedicated shells (Coil Rush, Chess Arena, Poker, Slots, Block Master)
  store/               Zustand: auth, game, socket, chat, ui, notifications
  socket/              hooks + unused legacy singleton
  services/            Axios REST layer
  providers/           Auth + Socket + Query
```

Playable routing:

| Route | Role |
|-------|------|
| `/games` | Catalog |
| `/games/[slug]` | Hub / rooms / leaderboard tab |
| `/games/[slug]/play` | Generic multiplayer shell |
| Dedicated apps | `snake-multiplayer`, `chess`, `block-master`, `classic-fruit-slots`, `poker` |

State is **Zustand + React Query**. There is no React game context. Server snapshots go into `game.store`; animations / Coil interpolation stay local.

---

## 3. Node.js backend structure

```
backend/src/
  server.ts            Mongo + Redis + HTTP + Socket.IO
  app.ts               Express middleware + /api routes
  routes/ controllers/ services/ repositories/ models/
  socket/              Single Server + namespaces
  games/               Engines (extend GameEngine) + poker/ + fruit-slots/
  utils/constants.ts   SOCKET_EVENTS, player limits, bots
```

Conventions: TypeScript strict, kebab-case files, route → controller → service → repository, `AppError`, singleton service exports.

---

## 4. Existing API routes

| Prefix | Purpose |
|--------|---------|
| `/api/auth` | Register, login, refresh, password, `/me` |
| `/api/users` | Profile, friends, stats |
| `/api/games` | **Catalog** CRUD (not live matches) |
| `/api/games/classic-fruit-slots` | Config + history |
| `/api/games/poker` | Tables, sit, history, config |
| `/api/matches` | Create/get match, waiting rooms, replay |
| `/api/leaderboard` | Period + gameType ranks |
| `/api/economy` | Wallet, store, missions |
| `/api/tournaments`, `/api/chat`, `/api/notifications`, `/api/admin`, `/api/platform` | Platform |

Realtime match create/join/move is **socket-first**. REST matches are for lobby lists and history.

**Collision note:** User-requested `POST /api/games` already means “admin create catalog game”. Live session REST is added under `/api/matches/:id/join|leave|result` so catalog routes stay intact.

---

## 5. Socket.IO

- **One** `Server` on the HTTP server (`socket/index.ts`).
- Redis adapter (`@socket.io/redis-adapter`) when Redis is up — required for multi-instance **emits**.
- JWT on every namespace (`handshake.auth.token`).
- Game rooms use **match `roomId` (UUID)**, not `game:{id}`. Poker uses `poker:{tableId}`. Slots uses `slots:{gameId}:{userId}`. Chat/presence use `user:{userId}`.

### Canonical match events (keep these)

**Client → server:** `game:matchmaking`, `game:cancelMatchmaking`, `game:createRoom`, `game:joinRoom`, `game:leaveRoom`, `game:ready`, `game:makeMove`, `game:surrender`, `game:offerDraw`, `game:acceptDraw`, `game:spectate`, `game:fillBot`, `game:inviteFriend`

**Server → client:** `game:roomCreated`, `game:matchFound`, `game:reconnected`, `game:playerJoined`, `game:playerLeft`, `game:countdown`, `game:gameStart`, `game:moveMade`, `game:gameOver`, `game:drawOffered`, `game:spectatorJoined`, `error`

### Do **not** alias (already used by fruit slots)

`game:join`, `game:leave`, `game:state`, `game:spin`, `game:spin:result`, `game:balance`, `game:history`

### Safe optional aliases (added)

| Alias | Maps to |
|-------|---------|
| `game:create` | `game:createRoom` |
| `game:action` | `game:makeMove` |
| `game:reconnect` | `game:joinRoom` |
| `game:start` | `game:ready` |
| `game:finish` | `game:surrender` |
| `game:created` | extra emit with `game:roomCreated` |
| `game:started` | extra emit with `game:gameStart` |
| `game:finished` | extra emit with `game:gameOver` |
| `game:player_joined` / `game:player_left` | extra emits |
| `game:error` | structured error (also keep `'error'`) |

---

## 6. Redis (before this work)

Single `ioredis` client. Used for:

- Socket.IO adapter pub/sub
- Poker table cache + lock (`poker:table:{id}:*`)
- Fruit slots session/state/idempotency/rate (`slots:*`)

**Not** used for matchmaking queues, active match rooms, or presence (those were in-process `Map`s). Server already continues if Redis is down.

---

## 7. MongoDB models

22 models. Game-relevant:

| Model | Role |
|-------|------|
| `Game` | Catalog (name, slug, min/max, category) |
| `Match` | Multiplayer session: players, roomId, moves, winner, status, settings |
| `Leaderboard` | Period + gameType ELO |
| `User` | Identity, ELO, coins, stats |
| `Session` | Socket session / presence persistence |
| `GameSession`, `Spin` | Fruit slots |
| `PokerTable`, `PokerHand`, `PokerAction`, `PokerPlayerSession` | Poker |
| `Transaction` | Economy |

No new duplicate “GameSession/Match” collection is required for board games. `Match` already stores type, players, start/end, status, winner, moves, metadata, timestamps.

High-frequency Coil Rush ticks are **not** written to Mongo every frame (steer is in-memory; ticks broadcast over socket).

---

## 8. Authentication

- HTTP: Bearer JWT or cookie; refresh on 401.
- Socket: same JWT on `auth.token`.
- Banned users rejected.
- **Never trust client `playerId` / score / winner.** Existing `game:makeMove` already uses `socket.user` and strips `_forcedDice`.

---

## 9. Existing games

| Game | Slug | Frontend | Backend | Transport | Authoritative? |
|------|------|----------|---------|-----------|----------------|
| Tic Tac Toe | `tic-tac-toe` | `components/game/TicTacToeBoard.tsx` + GenericPlay | `games/tic-tac-toe.ts` + bot | Socket match | Yes |
| Connect Four | `connect-four` | `ConnectFourBoard.tsx` | `games/connect-four.ts` + bot | Socket match | Yes |
| Chess | `chess` | `games/chess-arena/` | `games/chess.ts` | Socket + local AI | Online yes |
| Coil Rush | `snake-multiplayer` | `games/coil-rush/` | `games/snake-multiplayer.ts` | Socket ticks 50ms | Yes |
| Ludo | `ludo` | `LudoBoard.tsx` | `games/ludo.ts` + bot | Socket | Yes |
| Quiz Battle | `quiz-battle` | `QuizBattleBoard.tsx` | `games/quiz-battle.ts` | Socket | Yes |
| Fruit Slots | `classic-fruit-slots` | `games/classic-fruit-slots/` | `games/fruit-slots/` + service | REST + socket spin | Yes (server RNG) |
| Poker | `poker` | `games/poker/` | `games/poker/` + service | REST sit + `poker:*` | Yes |
| Block Master | `block-master` | `games/block-master/` | Catalog only | Local | Client high score |
| Mindi Cot | `mindi` | `games/mindi/` + Generic/MindiApp | `games/mindi/` + bot | Socket match | Yes |

~40 other slugs are catalog-only (seeded `Game` docs).

---

## 10. Per-game runtime (match games)

| Topic | Behavior |
|-------|----------|
| Game state | In-memory `GameEngine` on the process that created the room; hydrated from Mongo moves on rejoin |
| Player state | `Map<userId, { socketId, ready, connected }>` |
| Score | Winner from engine → `rewardService.settleMatch` (ELO/coins/XP). Slots/poker use economy chips/coins |
| Start | All ready + min players → 3s countdown (`snake-multiplayer` starts immediately) |
| End | `finishMatch` → persist → `game:gameOver` → drop in-memory room |
| Reconnect | Playing: slot kept `connected: false`. Rejoin `game:joinRoom` → hydrate → `game:reconnected`. Waiting: player was removed immediately (gap) |

---

## 11. Matchmaking / lobby

In-memory `activeRooms` + `matchmakingQueue` in `game.ts`. Also REST `GET /api/matches/waiting/:gameType`, create room, friend invite. Bot fill after 60s for TTT / C4 / Ludo.

**Multi-instance gap:** a waiting room on Server 1 is invisible to Server 2’s `activeRooms`. Socket.IO adapter only helps **emits**, not engine ownership.

---

## 12. Leaderboard

`GET /api/leaderboard/:gameType?period=` — daily/weekly/monthly/all_time. Updated on match settle. Frontend `/leaderboard` + per-game tabs.

---

## 13. User / player system

`User` + friends + presence namespace + wallet. In-match players are Match.players (ObjectId) plus `bot:{game}:{room}` ids.

---

## 14. Environment variables

Root `.env.example` and `backend/.env.example`:

`NODE_ENV`, `PORT`, `MONGODB_URI`, `REDIS_URL`, `JWT_*`, `CORS_ORIGIN`, `SMTP_*`, `CLIENT_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`

Added (optional, with defaults): `INSTANCE_ID`, `GAME_RECONNECT_GRACE_MS`

---

## 15. Error handling

HTTP: `AppError` + `errorHandler`. Socket: mostly `{ message }` on `'error'`. Slots/poker have `game:error` / `poker:error`.

---

## 16. Logging

Morgan for HTTP. Application logs are `console.*`. No Winston/Pino. Structured game logs are added as JSON lines via `gameLogger` (never tokens/passwords).

---

## 17. Tests

Jest unit tests for engines (TTT, C4, snake, fruit slots, poker, ranking, bots). No integration lifecycle tests (folder was empty).

---

## Target architecture (implemented incrementally)

```
Frontend GameClient  (reuses existing /game socket — no new connection)
        │
        ▼
Existing game events + safe aliases + standardized action { actionId, type, payload, timestamp }
        │
        ▼
Game namespace handler
        │
        ├── GameRegistry          (add a game without touching socket bootstrap)
        ├── GameValidator         (auth, membership, active, turn, duplicate actionId, timestamp)
        ├── GameSessionStore      (local engines + Redis metadata)
        ├── GameRedisService      (same ioredis client + memory fallback)
        └── Match / reward services → MongoDB checkpoints & results
```

**Adding a new match game:**

1. Implement `class MyGame extends GameEngine`
2. `gameRegistry.register({ gameId, createEngine, minPlayers, maxPlayers, ... })`
3. Seed a `Game` catalog row
4. Add a frontend board that calls `GameClient.sendAction` / existing `useGameSocket().makeMove`

No second Socket.IO server. No per-game Redis client.

---

## Migration principles

1. Do not replace `GameEngine`, poker, or slots.
2. Do not rename existing events the UI already listens to.
3. Do not write Coil Rush ticks to Mongo/Redis every 50ms.
4. Redis optional — memory fallback matches current “Redis down” behavior.
5. Server remains authoritative for score, winner, and completion.
6. Persist results on `Match`; use Redis for live metadata, queues, locks, presence, action ids, reconnect grace.

---

## Lifecycle (mapped to existing Match.status)

```
CREATED / WAITING → READY → STARTING (countdown) → ACTIVE (playing)
        ↘ PAUSED (optional, registry flag) ↗
ACTIVE → FINISHED / DRAW / ABORTED → PERSISTED (rewardService + Match)
```

---

## Redis key namespaces (new, do not collide with `slots:*` / `poker:*`)

| Key | Purpose |
|-----|---------|
| `game:{roomId}:meta` | Session metadata (matchId, type, owner instance, status) |
| `game:{roomId}:players` | Player ids + connected flags |
| `game:{roomId}:lock` | Action lock |
| `game:{roomId}:actions` | Seen actionIds (duplicate protection) |
| `game:{roomId}:checkpoint` | Occasional serialized state |
| `player:{userId}:games` | Rooms the player is in |
| `player:{userId}:presence` | Game-namespace presence |
| `player:{userId}:reconnect` | Grace-period reconnect blob |
| `matchmaking:{gameType}` | Queued user ids |
| `matchmaking:{gameType}:rooms` | Waiting room ids |
| `socket:{socketId}:user` | Socket → user |
| `game:cmd` | Pub/sub for cross-instance actions |

---

## Implementation phases (this change set)

| Phase | Work |
|-------|------|
| 1–2 | This analysis |
| 3 | `games/core/*` registry, types, validator, session store, logger, errors |
| 4 | Compat aliases + structured `game:error` on existing `/game` namespace |
| 5 | `GameRedisService` on the shared Redis client |
| 6 | REST join/leave/result on `/api/matches`; still persist via `Match` |
| 7 | Frontend `GameClient` using the existing game socket |
| 8 | Wire TTT/C4/Chess/Coil/Ludo/Quiz through GameClient action ids; register poker/slots/block-master |
| 9 | Reconnect grace + socket restore |
| 10–12 | Tests + typecheck |

Remaining follow-ups (not required to add a new engine game): sticky engine ownership under heavy multi-instance load if Redis is disabled; Block Master remains local-only by design.
