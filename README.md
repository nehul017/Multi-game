# Multi-Game: Multiplayer Gaming Platform

A production-ready multiplayer gaming platform built with Next.js, Express, Socket.IO, MongoDB, and Redis.

## Features

- **Multiple Games**: Tic Tac Toe, Connect Four, Chess, Snake Multiplayer, Ludo, Quiz Battle
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

### Socket Events

| Namespace | Events |
|-----------|--------|
| /game | createRoom, joinRoom, makeMove, gameOver |
| /chat | sendMessage, typing, joinRoom |
| /notification | subscribe, newNotification |
| /presence | heartbeat, userOnline, userOffline |

## Environment Variables

See `.env.example` for all required variables.

## Default Admin Account

After seeding, use these credentials:
- Email: admin@multigame.com
- Password: Admin@123

## License

MIT
