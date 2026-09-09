# GAME BACKEND INTEGRATION

Post-implementation report. Pre-change inventory is in `GAME_BACKEND_AUDIT.md`.

Worked in **Multi-game** (Next.js + Express). Shared live-game surface stays on `/api/matches` and the existing `/game` Socket.IO namespace.

---

## Every game

| Game | Already connected | What changed |
| ---- | ----------------- | ------------ |
| Tic Tac Toe | Socket match + Match + rewards | `GameOverModal` no longer invents coins/XP |
| Connect Four | Same | Same modal honesty |
| Ludo | Same | Same modal honesty |
| Quiz Battle | Socket match + server-side timing | Client sends elapsed `timeMs` instead of hardcoded 5000; modal honesty |
| Chess online | Socket match + rewards in result dialog | None |
| Chess computer/local | REST session + complete existed but play started without waiting | Session must succeed before play; rematch creates a new session; leftover solos aborted server-side |
| Coil Rush | Socket ticks + `POST /matches/:id/score` + overlay rewards | Score POST falls back to `roomId` when `gameId` is missing |
| Fruit Slots | REST + `game:spin` + Redis + Mongo | None |
| Poker | REST sit + `poker:*` + Redis + Mongo | None |
| Block Master | AuthGuard + session/complete + coins/XP | Server leaderboard on ready screen; leftover solos aborted on new start; global leaderboard shows Score |
| 36 catalog titles | Artwork / `Game` docs only | None — no gameplay exists |

---

## APIs added / reused

Mounted on existing `/api/matches` (catalog `/api/games` unchanged):

| Method | Path | Purpose |
| ------ | ---- | ------- |
| POST | `/api/matches/session` | Create + start a solo session (`Match` status `playing`). Aborts leftover solo `playing` sessions for the same user/game. |
| POST | `/api/matches/:id/complete` | Validate + persist result + rewards (idempotent) |
| POST | `/api/matches/:id/score` | Record in-progress personal score (Coil Rush) |
| POST | `/api/matches/:id/abort` | Abort an active session the caller belongs to |

`:id` accepts Mongo match id or `roomId`.

Existing endpoints (`POST /api/matches`, join/leave, `GET .../result`, leaderboard, slots, poker) were not replaced.

---

## Socket events added

None. Match, slots, and poker events are unchanged.

Canonical match events remain: `game:createRoom`, `game:joinRoom`, `game:leaveRoom`, `game:ready`, `game:makeMove`, `game:surrender`, `game:matchmaking`, `game:gameStart`, `game:moveMade`, `game:gameOver`, `game:reconnected`.

---

## Redis usage

Same ioredis client (`gameRedisService`):

- `game:{roomId}:meta` / players for solo sessions
- `game:rate:session:{userId}`, `game:rate:complete:{userId}`, `game:rate:score:{userId}`
- Existing poker/slots/match keys untouched

Permanent results are not Redis-only.

---

## MongoDB models / collections

No new collections.

- `matches` — multiplayer + solo sessions + `replayData` (verified score/result)
- `leaderboards` — `score` for Block Master; ELO for match games
- `users`, `transactions` — coins/XP via existing economy helpers
- Slots: `gamesessions`, `spins`
- Poker: `pokertables`, `pokerhands`, `pokeractions`, `pokerplayersessions`

---

## Security changes

- JWT required on session/complete/score/abort
- Membership check (cannot submit another user's session)
- Idempotent complete (replayed finished sessions return stored result)
- Server rejects impossible Block Master scores and forged chess checkmates
- Chess local cannot farm ranked wins (forced `completed`)
- Chess computer ELO uses server bot rating, not client winner coins
- Chess solo will not start play if session create fails
- New solo start aborts leftover `playing` solo matches for that user/game
- Rate limits on start/complete/score
- Client `winner` / `coins` / `rank` are ignored
- End-of-match UI no longer fabricates XP/coins when the server omits them
- Quiz scoring still uses server `Date.now() - roundStartTime`, not the client clock

---

## Tests performed

- Backend `tsc --noEmit` — pass
- Frontend `tsc --noEmit` — pass
- Jest: 14 suites, 150 tests — pass (including Coil Rush score validation)
- Live curl / browser against ports 3000/5000 — **not reachable from this session** (connection refused)

---

## Remaining issues

- 36 catalog-only titles still have no game implementation (intentional).
- Quiz Battle still has no AFK round timer; chess online still has no server clock (engine gaps, not connectivity).
- Block Master / chess-solo anti-cheat is plausibility validation, not a full server engine.
- Coil Rush personal score write does not settle the match again (avoids double rewards). Match-end rewards appear when `game:gameOver` arrives.
- Live multiplayer reconnect is unchanged and still process-local for engine ownership if Redis is down.
- End-to-end play in a browser was not executed in this session.
