# Mindi Cot / Mendikot

Server-authoritative 4-player partnership card game integrated into the existing MultiGame match stack.

## Architecture

Mindi is a `GameEngine` match game, not a second Socket.IO server or database.

```
Frontend MindiApp  →  existing /game namespace
        →  game:makeMove / game:fillBot / game:joinRoom
        →  GameRegistry.createEngine('mindi')
        →  Mindi engine (rules + validation)
        →  Redis session/lock/checkpoint
        →  Mongo Match + replayData
```

| Layer | Location |
| --- | --- |
| Engine | `backend/src/games/mindi/engine.ts` |
| Rules | `backend/src/games/mindi/rules.ts` |
| Legal moves | `backend/src/games/mindi/legal-moves.ts` |
| Bots | `backend/src/games/mindi/bot/` |
| Socket helpers | `backend/src/games/mindi/runtime.ts` |
| UI | `frontend/src/games/mindi/` |

## Game rules (default)

Configurable in `DEFAULT_MINDI_RULES` or `settings.rules`.

- 52-card deck, 13 cards each
- Seats 0+2 = Team A, seats 1+3 = Team B
- Trump = suit of the dealer’s last card (shown)
- Player left of dealer leads
- Must follow the lead suit when able
- Void of lead: any card, including trump
- Highest trump wins; otherwise highest lead-suit card (A high)
- Team with 3+ tens wins
- 2-2 tens: team with 7+ tricks wins
- All 4 tens = Mendikot; all 13 tricks = whitewash

Change a rule by editing `DEFAULT_MINDI_RULES` or passing `settings.rules` when the match is created.

## Bot system

Bots are in-memory seat holders (`bot:mindi:{room}:{seat}`). They never get a socket and never receive another hand.

Difficulty (default **medium**):

- Easy: legal card, mostly low
- Medium: win cheaply, dump low if partner is winning, protect 10s
- Hard: card counting, 10 capture/protection, trump conservation, endgame

Delay (server-scheduled, not frontend):

- Easy 800–1400 ms
- Medium 900–1700 ms
- Hard 1000–1900 ms

Change delay in `backend/src/games/mindi/bot/config.ts`.
Change difficulty from the Mindi hub or `settings.botDifficulty`.

## Socket events

Reuses the existing game events (no second namespace):

| Event | Role |
| --- | --- |
| `game:matchmaking` | Create/join a waiting table (`settings.botDifficulty`, `mode`) |
| `game:createRoom` | Private table |
| `game:fillBot` | Fill every empty seat with bots |
| `game:makeMove` | `{ action: 'play-card', cardId }` |
| `game:moveMade` | Personalized `gameState` (own hand only) |
| `game:moveMade` action `bot-thinking` | Bot is waiting to play |
| `game:reconnected` | Restore seat + authorized state |
| `game:gameOver` | Team result |

Hidden data is stripped per viewer. The public board has card counts, the current trick, scores, and trump — never other hands or the deck.

## Redis

Uses the existing `game:{roomId}:*` keys (meta, players, lock, actions, checkpoint). The action lock prevents a human play and a bot play from applying in the same turn.

## MongoDB

No new collection. `Match` stores:

- `settings.seatOrder` — 4 seat ids (humans + bot ids)
- `settings._deckSeed` — server-only, stripped from `toJSON`
- `replayData.mindiMoves` — every played card for reconnect/replay
- `replayData.result` — tens, tricks, winner team, flags, duration

## Reconnect / bot replacement

A disconnected human keeps their seat. After `GAME_RECONNECT_GRACE_MS` (default 30s) the server plays that seat with the bot engine. Rejoin reclaim the seat and stops takeover.

## Local development

1. MongoDB + Redis as for the rest of the platform
2. Backend `npm run dev` — `ensureMindiCatalog()` upserts the catalog row
3. Frontend `npm run dev` — open `/games/mindi`
4. Optional full seed: `npm run seed` in `backend`

## Testing

```bash
cd backend && npm test -- --testPathPattern=mindi
cd backend && npx tsc --noEmit
cd frontend && npm run lint
cd frontend && npm run build
```

## Environment

No new required variables. Optional existing:

- `GAME_RECONNECT_GRACE_MS` — disconnect grace before bot takeover (default `30000`)
- `REDIS_URL`, `MONGODB_URI` — shared platform clients
