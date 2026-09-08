# Multi-Game: Multiplayer Gaming Platform

A production-ready multiplayer gaming platform built with Next.js, Express, Socket.IO, MongoDB, and Redis.

## Features

- **Multiple Games**: Tic Tac Toe, Connect Four, Chess, Snake Multiplayer, Ludo, Quiz Battle, Block Master, Classic Fruit Slots, Poker Room
- **Real-time Multiplayer**: Socket.IO powered real-time gameplay
- **Matchmaking**: Random matching, private rooms, friend invites
- **Chat System**: Global chat, private messaging, in-game chat
- **Tournament System**: Single/double elimination, round-robin
- **Ranking System**: ELO rating, leaderboards, achievements, XP/levels
- **Admin Dashboard**: User management, analytics, game monitoring
- **Notifications**: Real-time friend requests, match invites, achievements
- **Spectator Mode**: Watch live games
- **Replay System**: Review past matches

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, Zustand, React Query |
| Backend | Node.js, Express, TypeScript, Socket.IO, JWT |
| Database | MongoDB with Mongoose ODM |
| Cache | Redis |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- MongoDB (or use Docker)
- Redis (or use Docker)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repo-url>
cd Multi-game

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
# API Docs: http://localhost:5000/api-docs
```

### Manual Setup

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

## Project Structure

```
Multi-game/
├── backend/                 # Express.js API Server
│   └── src/
│       ├── config/          # Database, Redis, env configuration
│       ├── controllers/     # Request handlers
│       ├── games/           # Game logic implementations
│       ├── interfaces/      # TypeScript interfaces
│       ├── middleware/       # Auth, validation, error handling
│       ├── models/          # Mongoose schemas
│       ├── repositories/    # Data access layer
│       ├── routes/          # API routes
│       ├── services/        # Business logic
│       ├── socket/          # Socket.IO namespaces & handlers
│       ├── types/           # TypeScript types
│       ├── utils/           # Helpers & constants
│       ├── validators/      # Input validation
│       ├── app.ts           # Express app configuration
│       └── server.ts        # Server entry point
├── frontend/                # Next.js Application
│   └── src/
│       ├── app/             # App Router pages
│       ├── components/      # React components
│       ├── hooks/           # Custom hooks
│       ├── lib/             # Utilities
│       ├── providers/       # Context providers
│       ├── services/        # API service layer
│       ├── socket/          # Socket.IO client
│       ├── store/           # Zustand state management
│       └── types/           # TypeScript types
├── docker-compose.yml       # Docker orchestration
├── .github/workflows/       # CI/CD pipelines
└── README.md
```

## API Documentation

API documentation is available at `http://localhost:5000/api-docs` when the backend is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login |
| GET | /api/users/profile | Get user profile |
| GET | /api/games | List all games |
| GET | /api/matches | Get match history |
| GET | /api/tournaments | List tournaments |
| GET | /api/leaderboard | Get leaderboard |
| GET | /api/chat/conversations | Get conversations |
| GET | /api/notifications | Get notifications |
| GET | /api/admin/dashboard | Admin dashboard stats |
| GET | /api/games/classic-fruit-slots | Fruit slots catalog + public config |
| GET | /api/games/classic-fruit-slots/config | Public paytable, paylines, bet limits |
| GET | /api/games/classic-fruit-slots/history | Authenticated spin history |
| GET | /api/games/poker | Poker catalog + public variants |
| GET | /api/games/poker/tables | Open poker tables |
| POST | /api/games/poker/tables | Create a poker table |
| POST | /api/games/poker/sit | Buy in and sit |
| GET | /api/games/poker/history | Authenticated hand history |

### Socket Events

| Namespace | Events |
|-----------|--------|
| /game | createRoom, joinRoom, makeMove, gameOver |
| /game | game:join, game:state, game:spin, game:spin:result, game:balance, game:history, game:leave, game:error |
| /game | poker:lobby, poker:table:*, poker:action, poker:draw, poker:showdown, poker:reconnect |
| /chat | sendMessage, typing, joinRoom |
| /notification | subscribe, newNotification |
| /presence | heartbeat, userOnline, userOffline |

## Classic Fruit Slots

Server-authoritative 5x3 fruit slot machine. The browser animates reels; it never generates the result, payout, or new balance.

### Architecture

- Engine: `backend/src/games/fruit-slots/` (`config.ts`, `symbols.ts`, `paylines.ts`, `engine.ts`)
- Transport: Socket.IO `/game` namespace, plus REST for config/history
- Wallet: existing `economyService` coin balance (`slot_bet` / `slot_win` transactions)
- Persistence: MongoDB `GameSession` and `Spin` collections
- Locks / cache: Redis with in-memory fallback (`slots:lock:*`, `slots:idem:*`, `slots:session:*`, `slots:state:*`, `slots:rate:*`)

### Local setup

1. Start MongoDB and Redis (Docker Compose or local).
2. Copy `.env.example` to `.env`. Required variables:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
MONGODB_URI=mongodb://localhost:27017/multigame
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

Never commit real credentials.

3. Seed the catalog (adds Classic Fruit Slots):

```bash
cd backend && npm run seed
```

4. Backend: `cd backend && npm run dev`
5. Frontend: `cd frontend && npm run dev`
6. Open `http://localhost:3000/games/classic-fruit-slots`

### Game engine configuration

Tune weights, paylines, and multipliers in `backend/src/games/fruit-slots/`. REST `/config` exposes names, assets, rarities, paylines, and payout multipliers — not symbol weights.

- 3 matching symbols: base payout
- 4 matching symbols: higher payout
- 5 matching symbols: highest payout
- Nine configurable paylines (horizontals, V, inverted V, diagonals, zigzags)

The generator uses weighted `Math.random()`. It is not advertised as a certified RNG or fair casino game.

### Testing

```bash
cd backend && npm test
```

Engine tests cover reel generation, symbol selection, payline detection, payouts, zero-win, maximum win, and invalid bets. Service tests cover insufficient balance, duplicate `requestId`, and concurrent spin locks.

### Production notes

- Redis should be available in production so spin locks and idempotency survive multiple API instances.
- Do not expose engine weights or Mongo/Redis URLs to Next.js client code.
- Rate-limit is 30 spins/minute/user. Duplicate socket `requestId`s replay the stored result instead of paying again.

## Poker Room

Server-authoritative multiplayer poker with four variants on one shared engine: Texas Hold’em, Omaha, Omaha Hi-Lo, and 5 Card Draw.

The browser never shuffles, deals, evaluates hands, or moves chips. It only renders the sanitized table snapshot and sends `poker:action` / `poker:draw`.

### Architecture

- Shared engine: `backend/src/games/poker/core/` (cards, deck, evaluator, betting, pots, table)
- Variants: `backend/src/games/poker/variants/` — Hold’em, Omaha, Omaha Hi-Lo, Five Card Draw
- Service: `backend/src/services/poker.service.ts` (Redis locks, wallet buy-in/cash-out, timers, bots)
- Transport: Socket.IO `/game` namespace (`poker:*` events) plus REST under `/api/games/poker`
- Wallet: existing `economyService` (`poker_buyin`, `poker_win`, `poker_refund`)
- Persistence: MongoDB `PokerTable`, `PokerHand`, `PokerAction`, `PokerPlayerSession`
- Realtime state: Redis keys `poker:table:{id}:state`, `poker:table:{id}:lock`, `poker:table:{id}:timer`

### Variants

| Game | Hole cards | Board | Evaluation |
|------|------------|-------|------------|
| Texas Hold’em | 2 | 5 | Best 5 from any 7 |
| Omaha | 4 | 5 | Exactly 2 hole + 3 board |
| Omaha Hi-Lo | 4 | 5 | High + 8-or-better low, 50/50 split |
| 5 Card Draw | 5 | none | Draw 0–5, then second betting round |

Omaha Hi-Lo lows must be five unpaired ranks of 8 or lower (Ace is low). No qualifying low means high takes the pot. Tied halves are split (quartered when applicable).

### Socket events

Client → server: `poker:lobby`, `poker:table:create`, `poker:table:join`, `poker:table:leave`, `poker:action`, `poker:draw`, `poker:reconnect`

Server → client: `poker:table:state`, `poker:action:accepted`, `poker:action:rejected`, `poker:turn`, `poker:community:update`, `poker:showdown`, `poker:hand:result`, `poker:balance:update`, `poker:timer`, `poker:error`

Each seated player receives a sanitized state: own hole cards, public board, allowed actions. Opponent hole cards are omitted until showdown. The deck is never sent.

### Local setup

Same stack as the rest of the platform. After backend + frontend are running:

1. Seed the catalog if needed: `cd backend && npm run seed`
2. Open `http://localhost:3000/games/poker`
3. Sign in (welcome coins cover a default 400 buy-in)
4. Choose a variant and sit. Practice tables fill empty seats with server-side bots.

### Adding a new poker variant

1. Add rules in `backend/src/games/poker/variants/<name>/rules.ts` implementing `VariantRules`.
2. Register it in `variants/shared.ts` and `POKER_VARIANTS` in `config.ts`.
3. Reuse `core/table.ts` — do not copy betting, pots, or turn logic.
4. Add evaluator coverage in `backend/src/__tests__/unit/poker.test.ts`.

### Testing

```bash
cd backend && npm test -- --testPathPattern=poker.test.ts
```

Engine tests cover dealing, streets, fold/check/call/raise/all-in, showdown, ties, side pots, Omaha 2+3 enforcement, Hi-Lo qualification and splits, draw replacements, hidden opponent cards, and illegal actions.

## Default Admin Account

After seeding, use these credentials:
- Email: admin@multigame.com
- Password: Admin@123

## License

MIT
