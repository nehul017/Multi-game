# GAME BACKEND AUDIT

Audit date: 2026-09-09  
Project: Multi-game (`/Users/dreamworld/Desktop/nehul_project_2025/Multi-game`)  
Stack: Next.js 14 · Express · Socket.IO 4.7 · MongoDB · Redis (ioredis) · JWT

This is the pre-implementation audit for the remaining integration work. Catalog-only titles are listed but are not playable implementations and will not receive fake engines.

---

## Inventory

| Game | Frontend | API | Socket | Redis | MongoDB | Auth | Score | Result | Status |
| ---- | -------- | --- | ------ | ----- | ------- | ---- | ----- | ------ | ------ |
| Tic Tac Toe (`tic-tac-toe`) | `components/game/TicTacToeBoard.tsx` + generic play | `/api/matches/*` | `/game` match events | `game:{roomId}:*` | `Match`, `Leaderboard`, `User` | JWT | Server winner | `rewardService.settleMatch` | FULLY CONNECTED |
| Connect Four (`connect-four`) | `ConnectFourBoard.tsx` + generic play | `/api/matches/*` | `/game` match events | `game:{roomId}:*` | `Match`, `Leaderboard` | JWT | Server winner | settleMatch | FULLY CONNECTED |
| Ludo (`ludo`) | `LudoBoard.tsx` + generic play | `/api/matches/*` | `/game` roll/move | `game:{roomId}:*` | `Match`, `Leaderboard` | JWT | Server winner | settleMatch | FULLY CONNECTED |
| Quiz Battle (`quiz-battle`) | `QuizBattleBoard.tsx` + generic play | `/api/matches/*` | `/game` answer | `game:{roomId}:*` | `Match`, `Leaderboard` | JWT | Server score (server clock) | settleMatch | PARTIALLY CONNECTED |
| Chess online (`chess`) | `games/chess-arena/` | `/api/matches/*` | `/game` move/draw/surrender | `game:{roomId}:*` | `Match`, `Leaderboard` | JWT | Server winner | settleMatch + result dialog | FULLY CONNECTED |
| Chess computer/local (`chess`) | same, local `ChessRules` | `/api/matches/session` + `/complete` | none | `game:{roomId}:*` | `Match` | JWT | Server-validated result | REST complete + rewards | PARTIALLY CONNECTED |
| Coil Rush (`snake-multiplayer`) | `games/coil-rush/` canvas | catalog + `POST /matches/:id/score` | `/game` steer/tick | high-freq + match meta | `Match` on finish | AuthGuard | personal POST + match settle | rewards on `game:gameOver` | PARTIALLY CONNECTED |
| Classic Fruit Slots (`classic-fruit-slots`) | `games/classic-fruit-slots/` | `/api/games/classic-fruit-slots/*` | `game:join/spin/leave` | `slots:*` | `GameSession`, `Spin`, `Transaction` | sign-in gate | server RNG | server payout | FULLY CONNECTED |
| Poker Room (`poker`) | `games/poker/` | `/api/games/poker/*` | `poker:*` | `poker:table:*` | `PokerTable`, `PokerHand`, `PokerAction`, `PokerPlayerSession` | sign-in gate | server chips | server showdown | FULLY CONNECTED |
| Block Master (`block-master`) | `games/block-master/` | `/api/matches/session` + `/complete` | none | `game:{roomId}:*` | `Match`, `Leaderboard.score` | AuthGuard | validated complete | coins/XP | PARTIALLY CONNECTED |
| 36 catalog titles | `data/home.ts` artwork only | `Game` catalog docs | none | none | `Game` row | n/a | n/a | n/a | CLIENT ONLY (no game) |

Catalog-only slugs (no engine, no play route): `cyber-strike`, `battle-arena`, `shadow-warriors`, `zombie-survival`, `warzone-legends`, `mystic-valley`, `lost-kingdom`, `island-explorer`, `dragon-quest`, `neon-racers`, `street-velocity`, `turbo-legends`, `drift-masters`, `shadow-quest`, `legend-of-heroes`, `dragon-realms`, `dark-kingdom`, `galaxy-warriors`, `cyber-assault`, `space-force`, `battle-front`, `empire-wars`, `battle-tactics`, `kingdom-clash`, `war-command`, `football-legends`, `basketball-pro`, `tennis-champions`, `street-cricket`, `puzzle-world`, `brain-challenge`, `color-quest`, `pixel-builder`, `city-builder`, `farm-life`, `airport-manager`.

These are marketing placeholders. They will not be given fake engines.

---

## Existing architecture

### API

Express mounts under `/api/*`. Pattern: route → controller → service → repository → Mongoose.

Reusable live-game surface (do not duplicate under `/api/games` — that prefix is catalog + slots + poker):

- `POST /api/matches` create
- `GET /api/matches/:id`
- `POST /api/matches/session` solo session (Block Master, chess computer/local)
- `POST /api/matches/:id/complete` validated result
- `POST /api/matches/:id/score` in-progress score (Coil Rush)
- `POST /api/matches/:id/join|leave`
- `GET /api/matches/:id/result` (read-only)
- `GET /api/leaderboard/:gameType`
- `GET /api/games/playable` → in-memory `gameRegistry`

Realtime play for match games is socket-first. REST is lobby/history/solo complete.

### Socket

One `Server` in `backend/src/socket/index.ts`. JWT on every namespace. Redis adapter when Redis is up.

Namespaces: `/`, `/game`, `/chat`, `/notifications`, `/presence`.

Canonical match events (keep): `game:createRoom`, `game:joinRoom`, `game:leaveRoom`, `game:ready`, `game:makeMove`, `game:surrender`, `game:matchmaking`, `game:gameStart`, `game:moveMade`, `game:gameOver`, `game:reconnected`, plus aliases in `game-runtime.ts`.

Do not reuse `game:join` / `game:spin` (fruit slots). Poker uses `poker:*`.

### Redis

Single ioredis client (`config/redis.ts`). Memory fallback if Redis is down.

Used for: Socket.IO adapter, poker table state/locks, slots locks/idempotency, match meta (`game:{roomId}:*`), matchmaking sets, presence, action dedup, session/complete/score rate limits.

Permanent results are **not** Redis-only.

### MongoDB

22 models. Game-relevant: `User`, `Game` (catalog), `Match` (multiplayer + reusable solo session), `GameSession`+`Spin` (slots only), poker collections, `Leaderboard`, `Transaction`, `Session` (presence, not gameplay).

`Match` already stores `gameType`, players, `roomId`, status, winner, moves, `replayData`, timestamps. Reuse it for solo sessions. Do not add a second GameSession collection for board/puzzle games.

### Auth

HTTP: Bearer or cookie JWT. Socket: `handshake.auth.token`. Banned users rejected. Server uses `socket.user` — never client `playerId` / winner / coins.

---

## Missing integration

### Game: Block Master
**Current:** AuthGuard + REST session/complete + validated score + coins/XP. High score still mirrored in `localStorage`. No in-game leaderboard. Abandoned `playing` sessions are not cleaned up when the player starts a new run.
**Missing:** Visible server leaderboard, abort of leftover solo sessions, score column on the global leaderboard page.
**Required:** Reuse `/api/matches` + existing `Leaderboard.score`. Do not send frames.
**Files:** `frontend/src/games/block-master/*`, `backend/src/services/game-result.service.ts`, `leaderboard.repository.ts`.

### Game: Chess (computer / local)
**Current:** REST session + complete exist. Play starts immediately and `startSolo()` is fire-and-forget — if the session request fails, gameplay continues and `complete()` no-ops.
**Missing:** Session must succeed before ranked/rewarded play. Abandoned solo matches should be aborted on a new start.
**Required:** Await session create; surface API errors; abort previous solo sessions server-side.
**Files:** `frontend/src/games/chess-arena/play/ChessMatchView.tsx`, `game-result.service.ts`.

### Game: Coil Rush
**Current:** Socket match + server ticks. Death overlay can show `game:gameOver` rewards. Personal score POSTs using `currentRoom.gameId` only — fails if that field is missing even though `roomId` is a valid lookup key.
**Missing:** Score POST fallback to `roomId`.
**Required:** `POST /api/matches/:id/score` with match id or room id. Do not double-settle.
**Files:** `frontend/src/games/coil-rush/CoilRushApp.tsx`.

### Game: Quiz Battle
**Current:** Full socket match. Server ignores client `timeMs` and uses `Date.now() - roundStartTime`. Frontend still sends a hardcoded `5000`. `GameOverModal` invents coins/XP when the server omits rewards.
**Missing:** Honest client timing; no fabricated rewards.
**Required:** Send elapsed ms; show only server rewards.
**Files:** `play/page.tsx`, `GameOverModal.tsx`.

### Games: TTT / C4 / Ludo / Chess online / Slots / Poker
**Current:** Full frontend → socket/REST → engine/service → Redis/Mongo → response.
**Missing:** `GameOverModal` fallback coins/XP (security/honesty). Quiz has no AFK timer; chess online has no clock enforcement — engine gaps, out of scope.
**Required:** Stop inventing rewards on the client.

### Games: 36 catalog placeholders
**Current:** Seeded `Game` docs + home cards.
**Missing:** Entire implementations.
**Required:** None. Do not invent gameplay.

---

## Implementation constraints (from this audit)

1. Add live session REST under `/api/matches`, not `/api/games`.
2. Reuse `Match` + `rewardService` + `gameRedisService` + `gameLogger`.
3. One Socket.IO server, one Redis client, one Mongo connection.
4. Do not convert Block Master or chess-local into socket tick streams.
5. Do not trust client winner/coins/rank/verified score.
6. Idempotent complete. Membership checks. Rate-limit complete/score.
7. Abort leftover solo sessions on a new start instead of leaking `playing` matches.
